use serde::{Deserialize, Serialize};
use std::{
  collections::HashSet,
  fs,
  fs::File,
  io::{BufReader, Read, Write},
  path::{Path, PathBuf},
  process::Command,
  time::{SystemTime, UNIX_EPOCH},
};
use tauri_plugin_shell::ShellExt;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ConvertFileRequest {
  file_name: String,
  kind: MediaKind,
  output_format: String,
  options: ConvertOptions,
  bytes: Vec<u8>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ConvertFilePathRequest {
  input_path: String,
  file_name: String,
  kind: MediaKind,
  output_format: String,
  options: ConvertOptions,
}

#[derive(Debug)]
struct ConversionJob {
  file_name: String,
  kind: MediaKind,
  output_format: String,
  options: ConvertOptions,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CopyGeneratedOutputRequest {
  source_path: String,
  target_path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ZipGeneratedOutputsRequest {
  target_path: String,
  outputs: Vec<ZipGeneratedOutputEntry>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ZipGeneratedOutputEntry {
  source_path: String,
  file_name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeFileMetadata {
  path: String,
  file_name: String,
  size: u64,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
enum MediaKind {
  Image,
  Audio,
  Video,
}

#[derive(Debug, Default, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ConvertOptions {
  quality: Option<u8>,
  width: Option<u32>,
  height: Option<u32>,
  fps: Option<u32>,
  bitrate: Option<String>,
  sample_rate: Option<u32>,
  channels: Option<u8>,
  remove_metadata: Option<bool>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ConvertFileResponse {
  bytes: Vec<u8>,
  file_name: String,
  mime_type: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ConvertFilePathResponse {
  native_path: String,
  file_name: String,
  mime_type: String,
}

#[derive(Debug)]
struct ConvertedOutputInfo {
  file_name: String,
  mime_type: String,
}

#[derive(Debug)]
enum FfmpegSource {
  BundledSidecar,
  SystemPath,
}

impl FfmpegSource {
  fn label(&self) -> &'static str {
    match self {
      Self::BundledSidecar => "bundled sidecar ffmpeg",
      Self::SystemPath => "system ffmpeg",
    }
  }
}

#[derive(Debug)]
struct FfmpegOutput {
  source: FfmpegSource,
  success: bool,
  status_label: String,
  stdout: String,
  stderr: String,
}

impl From<&ConvertFileRequest> for ConversionJob {
  fn from(request: &ConvertFileRequest) -> Self {
    Self {
      file_name: request.file_name.clone(),
      kind: request.kind.clone(),
      output_format: request.output_format.clone(),
      options: request.options.clone(),
    }
  }
}

impl From<ConvertFilePathRequest> for ConversionJob {
  fn from(request: ConvertFilePathRequest) -> Self {
    Self {
      file_name: request.file_name,
      kind: request.kind,
      output_format: request.output_format,
      options: request.options,
    }
  }
}

#[tauri::command]
async fn convert_file(
  app: tauri::AppHandle,
  request: ConvertFileRequest,
) -> Result<ConvertFileResponse, String> {
  let work_dir = create_work_dir()?;
  let result = convert_file_in_dir(&app, &work_dir, &request).await;
  let _ = fs::remove_dir_all(&work_dir);
  result
}

#[tauri::command]
async fn convert_file_path(
  app: tauri::AppHandle,
  request: ConvertFilePathRequest,
) -> Result<ConvertFilePathResponse, String> {
  let input_path = PathBuf::from(&request.input_path);
  if !input_path.is_file() {
    return Err("Selected input file does not exist or is not readable.".to_string());
  }

  let work_dir = create_work_dir()?;
  let job = ConversionJob::from(request);
  let output_format = normalize_format(&job.output_format);
  let output_path = work_dir.join(format!("output.{}", output_format));
  let result = convert_prepared_input(&app, &input_path, &output_path, &job).await;

  if result.is_err() {
    let _ = fs::remove_dir_all(&work_dir);
  }

  result.map(|response| ConvertFilePathResponse {
    native_path: path_arg(&output_path),
    file_name: response.file_name,
    mime_type: response.mime_type,
  })
}

async fn convert_file_in_dir(
  app: &tauri::AppHandle,
  work_dir: &Path,
  request: &ConvertFileRequest,
) -> Result<ConvertFileResponse, String> {
  let job = ConversionJob::from(request);
  let output_format = normalize_format(&job.output_format);
  let input_extension = get_file_extension(&job.file_name);
  let input_path = work_dir.join(format!("input.{}", input_extension));
  let output_path = work_dir.join(format!("output.{}", output_format));

  fs::write(&input_path, &request.bytes)
    .map_err(|error| format!("Could not prepare the input file: {error}"))?;

  let info = convert_prepared_input(app, &input_path, &output_path, &job).await?;
  let bytes = fs::read(&output_path)
    .map_err(|error| format!("Native FFmpeg finished but output could not be read: {error}"))?;

  Ok(ConvertFileResponse {
    bytes,
    file_name: info.file_name,
    mime_type: info.mime_type,
  })
}

async fn convert_prepared_input(
  app: &tauri::AppHandle,
  input_path: &Path,
  output_path: &Path,
  job: &ConversionJob,
) -> Result<ConvertedOutputInfo, String> {
  let output_format = normalize_format(&job.output_format);
  validate_output_format(&job.kind, &output_format)?;

  let args = build_ffmpeg_args(input_path, output_path, job, &output_format);
  let command_output = run_ffmpeg(app, &args).await?;

  if !command_output.success {
    return Err(format!(
      "Native FFmpeg failed with status {} using {} while running: ffmpeg {}. stderr: {} stdout: {}",
      command_output.status_label,
      command_output.source.label(),
      args.join(" "),
      tail_message(&command_output.stderr),
      tail_message(&command_output.stdout),
    ));
  }

  if !output_path.is_file() {
    return Err("Native FFmpeg finished but did not create an output file.".to_string());
  }

  Ok(ConvertedOutputInfo {
    file_name: build_output_name(&job.file_name, &output_format),
    mime_type: get_mime_type(&output_format).to_string(),
  })
}

#[tauri::command]
fn get_native_file_metadata(paths: Vec<String>) -> Result<Vec<NativeFileMetadata>, String> {
  paths
    .into_iter()
    .map(|path| {
      let file_path = PathBuf::from(&path);
      let metadata = fs::metadata(&file_path)
        .map_err(|error| format!("Could not inspect selected file: {error}"))?;

      if !metadata.is_file() {
        return Err(format!("Selected path is not a file: {path}"));
      }

      let file_name = file_path
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| format!("Selected file has an invalid name: {path}"))?
        .to_string();

      Ok(NativeFileMetadata {
        path,
        file_name,
        size: metadata.len(),
      })
    })
    .collect()
}

#[tauri::command]
fn copy_generated_output(request: CopyGeneratedOutputRequest) -> Result<(), String> {
  let source_path = PathBuf::from(&request.source_path);
  assert_generated_output_path(&source_path)?;

  fs::copy(&source_path, PathBuf::from(&request.target_path))
    .map(|_| ())
    .map_err(|error| format!("Could not save converted file: {error}"))
}

#[tauri::command]
fn delete_generated_output(path: String) -> Result<(), String> {
  let output_path = PathBuf::from(path);
  assert_generated_output_path(&output_path)?;

  if output_path.exists() {
    fs::remove_file(&output_path)
      .map_err(|error| format!("Could not remove temporary output file: {error}"))?;
  }

  if let Some(parent) = output_path.parent() {
    let _ = fs::remove_dir(parent);
  }

  Ok(())
}

#[tauri::command]
fn zip_generated_outputs(request: ZipGeneratedOutputsRequest) -> Result<(), String> {
  if request.outputs.is_empty() {
    return Err("No converted files were provided for the ZIP archive.".to_string());
  }

  write_zip_archive(&request.outputs, &PathBuf::from(request.target_path))
}

fn assert_generated_output_path(path: &Path) -> Result<(), String> {
  let canonical_path = fs::canonicalize(path)
    .map_err(|error| format!("Generated output file is not available: {error}"))?;
  let canonical_temp = std::env::temp_dir()
    .canonicalize()
    .map_err(|error| format!("Could not inspect the temporary folder: {error}"))?;
  let parent = canonical_path
    .parent()
    .ok_or_else(|| "Generated output path has no parent folder.".to_string())?;
  let parent_name = parent
    .file_name()
    .and_then(|value| value.to_str())
    .unwrap_or_default();

  if canonical_path.starts_with(&canonical_temp) && parent_name.starts_with("local-convert-") {
    Ok(())
  } else {
    Err("Refusing to access a file that was not generated by this app.".to_string())
  }
}

fn write_zip_archive(
  entries: &[ZipGeneratedOutputEntry],
  target_path: &Path,
) -> Result<(), String> {
  let mut zip_file = File::create(target_path)
    .map_err(|error| format!("Could not create ZIP archive: {error}"))?;
  let mut central_directory_entries = Vec::new();
  let mut used_names = HashSet::new();
  let mut offset = 0u64;
  let crc_table = build_crc_table();

  for entry in entries {
    let source_path = PathBuf::from(&entry.source_path);
    assert_generated_output_path(&source_path)?;

    let zip_name = get_unique_zip_name(&entry.file_name, &mut used_names);
    let name_bytes = zip_name.as_bytes().to_vec();
    let (crc, size) = calculate_file_crc32_and_size(&source_path, &crc_table)?;
    let compressed_size = to_zip_u32(size, "file is too large for ZIP32 output")?;
    let local_header_offset = to_zip_u32(offset, "ZIP archive is too large")?;
    let local_header = create_zip_local_header(&name_bytes, crc, compressed_size);

    zip_file
      .write_all(&local_header)
      .map_err(|error| format!("Could not write ZIP local header: {error}"))?;
    copy_file_into_writer(&source_path, &mut zip_file)?;

    central_directory_entries.push(ZipCentralDirectoryEntry {
      name_bytes,
      crc,
      compressed_size,
      local_header_offset,
    });

    offset += local_header.len() as u64 + size;
  }

  let central_directory_offset = offset;
  for entry in &central_directory_entries {
    let header = create_zip_central_directory_header(entry);
    zip_file
      .write_all(&header)
      .map_err(|error| format!("Could not write ZIP central directory: {error}"))?;
    offset += header.len() as u64;
  }

  let central_directory_size = offset - central_directory_offset;
  let end_record = create_zip_end_record(
    central_directory_entries.len(),
    to_zip_u32(central_directory_size, "ZIP central directory is too large")?,
    to_zip_u32(central_directory_offset, "ZIP archive is too large")?,
  )?;

  zip_file
    .write_all(&end_record)
    .map_err(|error| format!("Could not finish ZIP archive: {error}"))?;

  Ok(())
}

struct ZipCentralDirectoryEntry {
  name_bytes: Vec<u8>,
  crc: u32,
  compressed_size: u32,
  local_header_offset: u32,
}

fn create_zip_local_header(name_bytes: &[u8], crc: u32, size: u32) -> Vec<u8> {
  let mut header = Vec::with_capacity(30 + name_bytes.len());
  header.extend(0x04034b50u32.to_le_bytes());
  header.extend(20u16.to_le_bytes());
  header.extend(0x0800u16.to_le_bytes());
  header.extend(0u16.to_le_bytes());
  header.extend(0u16.to_le_bytes());
  header.extend(0u16.to_le_bytes());
  header.extend(crc.to_le_bytes());
  header.extend(size.to_le_bytes());
  header.extend(size.to_le_bytes());
  header.extend((name_bytes.len() as u16).to_le_bytes());
  header.extend(0u16.to_le_bytes());
  header.extend(name_bytes);
  header
}

fn create_zip_central_directory_header(entry: &ZipCentralDirectoryEntry) -> Vec<u8> {
  let mut header = Vec::with_capacity(46 + entry.name_bytes.len());
  header.extend(0x02014b50u32.to_le_bytes());
  header.extend(20u16.to_le_bytes());
  header.extend(20u16.to_le_bytes());
  header.extend(0x0800u16.to_le_bytes());
  header.extend(0u16.to_le_bytes());
  header.extend(0u16.to_le_bytes());
  header.extend(0u16.to_le_bytes());
  header.extend(entry.crc.to_le_bytes());
  header.extend(entry.compressed_size.to_le_bytes());
  header.extend(entry.compressed_size.to_le_bytes());
  header.extend((entry.name_bytes.len() as u16).to_le_bytes());
  header.extend(0u16.to_le_bytes());
  header.extend(0u16.to_le_bytes());
  header.extend(0u16.to_le_bytes());
  header.extend(0u16.to_le_bytes());
  header.extend(0u32.to_le_bytes());
  header.extend(entry.local_header_offset.to_le_bytes());
  header.extend(&entry.name_bytes);
  header
}

fn create_zip_end_record(
  entry_count: usize,
  central_directory_size: u32,
  central_directory_offset: u32,
) -> Result<Vec<u8>, String> {
  let entry_count =
    u16::try_from(entry_count).map_err(|_| "Too many files for ZIP32 output.".to_string())?;
  let mut record = Vec::with_capacity(22);
  record.extend(0x06054b50u32.to_le_bytes());
  record.extend(0u16.to_le_bytes());
  record.extend(0u16.to_le_bytes());
  record.extend(entry_count.to_le_bytes());
  record.extend(entry_count.to_le_bytes());
  record.extend(central_directory_size.to_le_bytes());
  record.extend(central_directory_offset.to_le_bytes());
  record.extend(0u16.to_le_bytes());
  Ok(record)
}

fn calculate_file_crc32_and_size(
  path: &Path,
  crc_table: &[u32; 256],
) -> Result<(u32, u64), String> {
  let file = File::open(path).map_err(|error| format!("Could not read ZIP source: {error}"))?;
  let mut reader = BufReader::new(file);
  let mut buffer = [0u8; 64 * 1024];
  let mut crc = 0xffffffffu32;
  let mut size = 0u64;

  loop {
    let read = reader
      .read(&mut buffer)
      .map_err(|error| format!("Could not read ZIP source: {error}"))?;
    if read == 0 {
      break;
    }

    size += read as u64;
    for byte in &buffer[..read] {
      crc = (crc >> 8) ^ crc_table[((crc ^ u32::from(*byte)) & 0xff) as usize];
    }
  }

  Ok((crc ^ 0xffffffff, size))
}

fn copy_file_into_writer(path: &Path, writer: &mut File) -> Result<(), String> {
  let mut source =
    File::open(path).map_err(|error| format!("Could not open converted file: {error}"))?;
  std::io::copy(&mut source, writer)
    .map(|_| ())
    .map_err(|error| format!("Could not write converted file into ZIP: {error}"))
}

fn build_crc_table() -> [u32; 256] {
  let mut table = [0u32; 256];

  for (index, value) in table.iter_mut().enumerate() {
    let mut crc = index as u32;

    for _ in 0..8 {
      crc = if crc & 1 == 1 {
        0xedb88320 ^ (crc >> 1)
      } else {
        crc >> 1
      };
    }

    *value = crc;
  }

  table
}

fn to_zip_u32(value: u64, message: &str) -> Result<u32, String> {
  u32::try_from(value).map_err(|_| message.to_string())
}

fn get_unique_zip_name(file_name: &str, used_names: &mut HashSet<String>) -> String {
  let safe_name = sanitize_zip_name(file_name);
  let path = Path::new(&safe_name);
  let stem = path
    .file_stem()
    .and_then(|value| value.to_str())
    .unwrap_or("converted-file")
    .to_string();
  let extension = path
    .extension()
    .and_then(|value| value.to_str())
    .map(|value| format!(".{value}"))
    .unwrap_or_default();
  let mut candidate = safe_name;
  let mut index = 2;

  while used_names.contains(&candidate.to_lowercase()) {
    candidate = format!("{stem} ({index}){extension}");
    index += 1;
  }

  used_names.insert(candidate.to_lowercase());
  candidate
}

fn sanitize_zip_name(file_name: &str) -> String {
  let sanitized = file_name
    .chars()
    .map(|character| {
      if matches!(character, '\\' | '/' | ':' | '*' | '?' | '"' | '<' | '>' | '|') {
        '_'
      } else {
        character
      }
    })
    .collect::<String>()
    .split_whitespace()
    .collect::<Vec<_>>()
    .join(" ");

  if sanitized.is_empty() {
    "converted-file".to_string()
  } else {
    sanitized
  }
}

async fn run_ffmpeg(app: &tauri::AppHandle, args: &[String]) -> Result<FfmpegOutput, String> {
  let sidecar_error = match run_bundled_ffmpeg(app, args).await {
    Ok(output) => return Ok(output),
    Err(error) => error,
  };

  match run_system_ffmpeg(args) {
    Ok(output) => Ok(output),
    Err(error) if error.kind() == std::io::ErrorKind::NotFound => Err(format!(
      "FFmpeg engine missing. Tried bundled sidecar ffmpeg first ({sidecar_error}), then system ffmpeg on PATH (not found). Add a bundled FFmpeg sidecar or install FFmpeg and make sure the ffmpeg command is available on PATH."
    )),
    Err(error) => Err(format!(
      "Could not start FFmpeg engine. Bundled sidecar failed: {sidecar_error}. System ffmpeg failed: {error}"
    )),
  }
}

async fn run_bundled_ffmpeg(
  app: &tauri::AppHandle,
  args: &[String],
) -> Result<FfmpegOutput, String> {
  let command = app
    .shell()
    .sidecar("ffmpeg")
    .map_err(|error| format!("sidecar is not configured or not bundled: {error}"))?
    .args(args.to_vec());

  let output = command
    .output()
    .await
    .map_err(|error| format!("sidecar could not be started: {error}"))?;

  Ok(FfmpegOutput {
    source: FfmpegSource::BundledSidecar,
    success: output.status.success(),
    status_label: output
      .status
      .code()
      .map(|code| code.to_string())
      .unwrap_or_else(|| "terminated by signal".to_string()),
    stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
    stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
  })
}

fn run_system_ffmpeg(args: &[String]) -> Result<FfmpegOutput, std::io::Error> {
  let output = Command::new("ffmpeg").args(args).output()?;

  Ok(FfmpegOutput {
    source: FfmpegSource::SystemPath,
    success: output.status.success(),
    status_label: output.status.to_string(),
    stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
    stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
  })
}

fn build_ffmpeg_args(
  input_path: &Path,
  output_path: &Path,
  job: &ConversionJob,
  output_format: &str,
) -> Vec<String> {
  let mut args = vec![
    "-hide_banner".to_string(),
    "-y".to_string(),
    "-i".to_string(),
    path_arg(input_path),
  ];

  match job.kind {
    MediaKind::Image => push_image_args(&mut args, job, output_format),
    MediaKind::Audio => push_audio_args(&mut args, job, output_format),
    MediaKind::Video => push_video_args(&mut args, job, output_format),
  }

  args.push(path_arg(output_path));
  args
}

fn push_image_args(args: &mut Vec<String>, job: &ConversionJob, output_format: &str) {
  args.extend([
    "-map".to_string(),
    "0:v:0".to_string(),
    "-an".to_string(),
    "-sn".to_string(),
    "-dn".to_string(),
  ]);

  if let Some(filter) = build_visual_filter(&job.options, output_format, &job.kind) {
    args.extend(["-vf".to_string(), filter]);
  }

  if output_format != "gif" {
    args.extend(["-frames:v".to_string(), "1".to_string()]);
  }

  if job.options.remove_metadata.unwrap_or(false) {
    args.extend(["-map_metadata".to_string(), "-1".to_string()]);
  }

  match output_format {
    "jpg" | "jpeg" => args.extend([
      "-q:v".to_string(),
      to_jpeg_quality(job.options.quality).to_string(),
    ]),
    "png" => args.extend([
      "-compression_level".to_string(),
      to_png_compression(job.options.quality).to_string(),
    ]),
    "webp" => args.extend([
      "-c:v".to_string(),
      "libwebp".to_string(),
      "-quality".to_string(),
      to_percent_quality(job.options.quality).to_string(),
    ]),
    "avif" => args.extend([
      "-c:v".to_string(),
      "libaom-av1".to_string(),
      "-crf".to_string(),
      to_avif_crf(job.options.quality).to_string(),
    ]),
    _ => {}
  }
}

fn push_audio_args(args: &mut Vec<String>, job: &ConversionJob, output_format: &str) {
  args.extend([
    "-map".to_string(),
    "0:a:0".to_string(),
    "-vn".to_string(),
    "-sn".to_string(),
    "-dn".to_string(),
  ]);

  if job.options.remove_metadata.unwrap_or(false) {
    args.extend(["-map_metadata".to_string(), "-1".to_string()]);
  }

  args.extend(get_audio_codec_args(output_format));

  if let Some(bitrate) = &job.options.bitrate {
    if output_format != "wav" && output_format != "flac" {
      args.extend(["-b:a".to_string(), format!("{bitrate}k")]);
    }
  }

  if let Some(sample_rate) = job.options.sample_rate {
    args.extend(["-ar".to_string(), sample_rate.to_string()]);
  }

  if let Some(channels) = job.options.channels {
    args.extend(["-ac".to_string(), channels.to_string()]);
  }
}

fn push_video_args(args: &mut Vec<String>, job: &ConversionJob, output_format: &str) {
  args.extend([
    "-map".to_string(),
    "0:v:0".to_string(),
    "-map".to_string(),
    "0:a?".to_string(),
    "-sn".to_string(),
    "-dn".to_string(),
  ]);

  if let Some(filter) = build_visual_filter(&job.options, output_format, &job.kind) {
    args.extend(["-vf".to_string(), filter]);
  }

  if job.options.remove_metadata.unwrap_or(false) {
    args.extend(["-map_metadata".to_string(), "-1".to_string()]);
  }

  if let Some(fps) = job.options.fps {
    args.extend(["-r".to_string(), fps.to_string()]);
  }

  args.extend(get_video_codec_args(output_format, job.options.quality));

  if let Some(bitrate) = &job.options.bitrate {
    args.extend(["-b:v".to_string(), format!("{bitrate}M")]);
  }

  if matches!(output_format, "mp4" | "mov") {
    args.extend(["-movflags".to_string(), "faststart".to_string()]);
  }
}

fn build_visual_filter(
  options: &ConvertOptions,
  output_format: &str,
  kind: &MediaKind,
) -> Option<String> {
  let mut filters = Vec::new();

  if options.width.is_some() || options.height.is_some() {
    filters.push(format!(
      "scale={}:{}",
      options
        .width
        .map(|value| value.to_string())
        .unwrap_or_else(|| "-2".to_string()),
      options
        .height
        .map(|value| value.to_string())
        .unwrap_or_else(|| "-2".to_string()),
    ));
  }

  if matches!(output_format, "jpg" | "jpeg") || matches!(kind, MediaKind::Video) {
    filters.push("format=yuv420p".to_string());
  }

  if filters.is_empty() {
    None
  } else {
    Some(filters.join(","))
  }
}

fn get_audio_codec_args(output_format: &str) -> Vec<String> {
  match output_format {
    "mp3" => vec!["-c:a".to_string(), "libmp3lame".to_string()],
    "wav" => vec!["-c:a".to_string(), "pcm_s16le".to_string()],
    "aac" | "m4a" => vec!["-c:a".to_string(), "aac".to_string()],
    "ogg" => vec!["-c:a".to_string(), "libvorbis".to_string()],
    "flac" => vec!["-c:a".to_string(), "flac".to_string()],
    _ => Vec::new(),
  }
}

fn get_video_codec_args(output_format: &str, quality: Option<u8>) -> Vec<String> {
  let crf = to_video_crf(quality).to_string();

  match output_format {
    "webm" => vec![
      "-c:v".to_string(),
      "libvpx-vp9".to_string(),
      "-crf".to_string(),
      crf,
      "-b:v".to_string(),
      "0".to_string(),
      "-c:a".to_string(),
      "libopus".to_string(),
    ],
    "avi" => vec![
      "-c:v".to_string(),
      "mpeg4".to_string(),
      "-q:v".to_string(),
      to_mpeg4_quality(quality).to_string(),
      "-c:a".to_string(),
      "libmp3lame".to_string(),
    ],
    _ => vec![
      "-c:v".to_string(),
      "libx264".to_string(),
      "-preset".to_string(),
      "veryfast".to_string(),
      "-crf".to_string(),
      crf,
      "-c:a".to_string(),
      "aac".to_string(),
    ],
  }
}

fn validate_output_format(kind: &MediaKind, output_format: &str) -> Result<(), String> {
  let is_allowed = match kind {
    MediaKind::Image => matches!(
      output_format,
      "png" | "jpg" | "jpeg" | "webp" | "gif" | "avif" | "bmp" | "tif" | "tiff"
    ),
    MediaKind::Audio => {
      matches!(output_format, "mp3" | "wav" | "aac" | "ogg" | "flac" | "m4a")
    }
    MediaKind::Video => matches!(output_format, "mp4" | "webm" | "mov" | "mkv" | "avi"),
  };

  if is_allowed {
    Ok(())
  } else {
    Err(format!("Unsupported output format: {output_format}"))
  }
}

fn create_work_dir() -> Result<PathBuf, String> {
  let unique_id = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map_err(|error| format!("System clock error: {error}"))?
    .as_nanos();
  let path = std::env::temp_dir().join(format!(
    "local-convert-{}-{unique_id}",
    std::process::id()
  ));

  fs::create_dir_all(&path)
    .map_err(|error| format!("Could not create a temporary conversion folder: {error}"))?;

  Ok(path)
}

fn get_file_extension(file_name: &str) -> String {
  Path::new(file_name)
    .extension()
    .and_then(|extension| extension.to_str())
    .map(normalize_format)
    .filter(|extension| !extension.is_empty())
    .unwrap_or_else(|| "bin".to_string())
}

fn build_output_name(file_name: &str, output_format: &str) -> String {
  let stem = Path::new(file_name)
    .file_stem()
    .and_then(|stem| stem.to_str())
    .unwrap_or("converted");

  format!("{}.{}", sanitize_file_stem(stem), output_format)
}

fn sanitize_file_stem(value: &str) -> String {
  let sanitized: String = value
    .chars()
    .map(|character| {
      if character.is_alphanumeric() || matches!(character, '-' | '_' | ' ') {
        character
      } else {
        '_'
      }
    })
    .collect();

  if sanitized.trim().is_empty() {
    "converted".to_string()
  } else {
    sanitized
  }
}

fn normalize_format(value: &str) -> String {
  value.trim().trim_start_matches('.').to_ascii_lowercase()
}

fn path_arg(path: &Path) -> String {
  path.to_string_lossy().into_owned()
}

fn tail_message(stderr: &str) -> String {
  let lines: Vec<&str> = stderr
    .lines()
    .map(str::trim)
    .filter(|line| !line.is_empty())
    .collect();

  lines
    .iter()
    .rev()
    .take(5)
    .copied()
    .collect::<Vec<&str>>()
    .into_iter()
    .rev()
    .collect::<Vec<&str>>()
    .join(" ")
}

fn get_mime_type(output_format: &str) -> &'static str {
  match output_format {
    "png" => "image/png",
    "jpg" | "jpeg" => "image/jpeg",
    "webp" => "image/webp",
    "avif" => "image/avif",
    "gif" => "image/gif",
    "bmp" => "image/bmp",
    "tif" | "tiff" => "image/tiff",
    "mp3" => "audio/mpeg",
    "wav" => "audio/wav",
    "aac" => "audio/aac",
    "ogg" => "audio/ogg",
    "flac" => "audio/flac",
    "m4a" => "audio/mp4",
    "mp4" => "video/mp4",
    "webm" => "video/webm",
    "mov" => "video/quicktime",
    "mkv" => "video/x-matroska",
    "avi" => "video/x-msvideo",
    _ => "application/octet-stream",
  }
}

fn to_percent_quality(quality: Option<u8>) -> u8 {
  quality.unwrap_or(88).clamp(1, 100)
}

fn to_jpeg_quality(quality: Option<u8>) -> u8 {
  let percent = f32::from(to_percent_quality(quality));
  (31.0 - (percent / 100.0) * 29.0).round().clamp(2.0, 31.0) as u8
}

fn to_mpeg4_quality(quality: Option<u8>) -> u8 {
  to_jpeg_quality(quality)
}

fn to_png_compression(quality: Option<u8>) -> u8 {
  let percent = f32::from(to_percent_quality(quality));
  (9.0 - (percent / 100.0) * 9.0).round().clamp(0.0, 9.0) as u8
}

fn to_avif_crf(quality: Option<u8>) -> u8 {
  let percent = f32::from(to_percent_quality(quality));
  (63.0 - (percent / 100.0) * 63.0).round().clamp(0.0, 63.0) as u8
}

fn to_video_crf(quality: Option<u8>) -> u8 {
  let percent = f32::from(to_percent_quality(quality));
  (51.0 - (percent / 100.0) * 33.0).round().clamp(18.0, 51.0) as u8
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![
      convert_file,
      convert_file_path,
      copy_generated_output,
      delete_generated_output,
      get_native_file_metadata,
      zip_generated_outputs
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
