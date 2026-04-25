use std::{
    fs,
    path::{Path, PathBuf},
};

use tauri::Manager;

use crate::{
    conversion_paths::{
        build_output_name, create_work_dir, get_file_extension, normalize_format, path_arg,
    },
    ffmpeg::{
        args::{build_ffmpeg_args, get_mime_type, tail_message, validate_output_format},
        runner::{run_ffmpeg, stop_all_conversions, RunningFfmpegProcesses},
    },
    types::{
        ConversionJob, ConvertFilePathRequest, ConvertFilePathResponse, ConvertFileRequest,
        ConvertFileResponse, ConvertedOutputInfo,
    },
};

#[tauri::command]
pub async fn convert_file(
    app: tauri::AppHandle,
    request: ConvertFileRequest,
) -> Result<ConvertFileResponse, String> {
    let work_dir = create_work_dir()?;
    let result = convert_file_in_dir(&app, &work_dir, &request).await;
    let _ = fs::remove_dir_all(&work_dir);
    result
}

#[tauri::command]
pub async fn convert_file_path(
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

#[tauri::command]
pub fn cancel_conversion(app: tauri::AppHandle, job_id: String) -> Result<(), String> {
    app.state::<RunningFfmpegProcesses>().cancel(&job_id);
    Ok(())
}

#[tauri::command]
pub fn cancel_all_conversions(app: tauri::AppHandle) -> Result<(), String> {
    stop_all_conversions(&app);
    Ok(())
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
    let command_output = run_ffmpeg(app, &job.job_id, &args).await?;

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
