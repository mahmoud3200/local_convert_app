use serde::{Deserialize, Serialize};
use std::{
  fs,
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
#[serde(rename_all = "lowercase")]
enum MediaKind {
  Image,
  Audio,
  Video,
}

#[derive(Debug, Default, Deserialize)]
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

#[tauri::command]
async fn convert_file(
  app: tauri::AppHandle,
  request: ConvertFileRequest,
) -> Result<ConvertFileResponse, String> {
  let work_dir = create_work_dir()?;
  let result = convert_file_in_dir(&app, &work_dir, request).await;
  let _ = fs::remove_dir_all(&work_dir);
  result
}

async fn convert_file_in_dir(
  app: &tauri::AppHandle,
  work_dir: &Path,
  request: ConvertFileRequest,
) -> Result<ConvertFileResponse, String> {
  let output_format = normalize_format(&request.output_format);
  validate_output_format(&request.kind, &output_format)?;

  let input_extension = get_file_extension(&request.file_name);
  let input_path = work_dir.join(format!("input.{}", input_extension));
  let output_path = work_dir.join(format!("output.{}", output_format));

  fs::write(&input_path, &request.bytes)
    .map_err(|error| format!("Could not prepare the input file: {error}"))?;

  let args = build_ffmpeg_args(&input_path, &output_path, &request, &output_format);
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

  let bytes = fs::read(&output_path)
    .map_err(|error| format!("Native FFmpeg finished but output could not be read: {error}"))?;

  Ok(ConvertFileResponse {
    bytes,
    file_name: build_output_name(&request.file_name, &output_format),
    mime_type: get_mime_type(&output_format).to_string(),
  })
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
  request: &ConvertFileRequest,
  output_format: &str,
) -> Vec<String> {
  let mut args = vec![
    "-hide_banner".to_string(),
    "-y".to_string(),
    "-i".to_string(),
    path_arg(input_path),
  ];

  match request.kind {
    MediaKind::Image => push_image_args(&mut args, request, output_format),
    MediaKind::Audio => push_audio_args(&mut args, request, output_format),
    MediaKind::Video => push_video_args(&mut args, request, output_format),
  }

  args.push(path_arg(output_path));
  args
}

fn push_image_args(args: &mut Vec<String>, request: &ConvertFileRequest, output_format: &str) {
  args.extend([
    "-map".to_string(),
    "0:v:0".to_string(),
    "-an".to_string(),
    "-sn".to_string(),
    "-dn".to_string(),
  ]);

  if let Some(filter) = build_visual_filter(&request.options, output_format, &request.kind) {
    args.extend(["-vf".to_string(), filter]);
  }

  if output_format != "gif" {
    args.extend(["-frames:v".to_string(), "1".to_string()]);
  }

  if request.options.remove_metadata.unwrap_or(false) {
    args.extend(["-map_metadata".to_string(), "-1".to_string()]);
  }

  match output_format {
    "jpg" | "jpeg" => args.extend([
      "-q:v".to_string(),
      to_jpeg_quality(request.options.quality).to_string(),
    ]),
    "png" => args.extend([
      "-compression_level".to_string(),
      to_png_compression(request.options.quality).to_string(),
    ]),
    "webp" => args.extend([
      "-c:v".to_string(),
      "libwebp".to_string(),
      "-quality".to_string(),
      to_percent_quality(request.options.quality).to_string(),
    ]),
    "avif" => args.extend([
      "-c:v".to_string(),
      "libaom-av1".to_string(),
      "-crf".to_string(),
      to_avif_crf(request.options.quality).to_string(),
    ]),
    _ => {}
  }
}

fn push_audio_args(args: &mut Vec<String>, request: &ConvertFileRequest, output_format: &str) {
  args.extend([
    "-map".to_string(),
    "0:a:0".to_string(),
    "-vn".to_string(),
    "-sn".to_string(),
    "-dn".to_string(),
  ]);

  if request.options.remove_metadata.unwrap_or(false) {
    args.extend(["-map_metadata".to_string(), "-1".to_string()]);
  }

  args.extend(get_audio_codec_args(output_format));

  if let Some(bitrate) = &request.options.bitrate {
    if output_format != "wav" && output_format != "flac" {
      args.extend(["-b:a".to_string(), format!("{bitrate}k")]);
    }
  }

  if let Some(sample_rate) = request.options.sample_rate {
    args.extend(["-ar".to_string(), sample_rate.to_string()]);
  }

  if let Some(channels) = request.options.channels {
    args.extend(["-ac".to_string(), channels.to_string()]);
  }
}

fn push_video_args(args: &mut Vec<String>, request: &ConvertFileRequest, output_format: &str) {
  args.extend([
    "-map".to_string(),
    "0:v:0".to_string(),
    "-map".to_string(),
    "0:a?".to_string(),
    "-sn".to_string(),
    "-dn".to_string(),
  ]);

  if let Some(filter) = build_visual_filter(&request.options, output_format, &request.kind) {
    args.extend(["-vf".to_string(), filter]);
  }

  if request.options.remove_metadata.unwrap_or(false) {
    args.extend(["-map_metadata".to_string(), "-1".to_string()]);
  }

  if let Some(fps) = request.options.fps {
    args.extend(["-r".to_string(), fps.to_string()]);
  }

  args.extend(get_video_codec_args(output_format, request.options.quality));

  if let Some(bitrate) = &request.options.bitrate {
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
      if character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | ' ') {
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
    .invoke_handler(tauri::generate_handler![convert_file])
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
