use std::{
    collections::{HashMap, HashSet},
    sync::Mutex,
};

use tauri::Manager;
use tauri_plugin_shell::process::{Command as ShellCommand, CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

use crate::power::SleepInhibitor;

#[derive(Debug)]
pub enum FfmpegSource {
    BundledSidecar,
    SystemPath,
}

impl FfmpegSource {
    pub fn label(&self) -> &'static str {
        match self {
            Self::BundledSidecar => "bundled sidecar ffmpeg",
            Self::SystemPath => "system ffmpeg",
        }
    }
}

#[derive(Debug)]
pub struct FfmpegOutput {
    pub source: FfmpegSource,
    pub success: bool,
    pub status_label: String,
    pub stdout: String,
    pub stderr: String,
}

#[derive(Default)]
pub struct RunningFfmpegProcesses {
    state: Mutex<RunningFfmpegState>,
}

#[derive(Default)]
struct RunningFfmpegState {
    children: HashMap<String, CommandChild>,
    cancelled_jobs: HashSet<String>,
}

impl RunningFfmpegProcesses {
    pub fn cancel(&self, job_id: &str) {
        let child = {
            let mut state = self.state.lock().unwrap();
            let child = state.children.remove(job_id);

            if child.is_none() {
                state.cancelled_jobs.insert(job_id.to_string());
            }

            child
        };

        if let Some(child) = child {
            let _ = child.kill();
        }
    }

    pub fn kill_all(&self) {
        let children = {
            let mut state = self.state.lock().unwrap();
            state.cancelled_jobs.clear();
            std::mem::take(&mut state.children)
        };

        for child in children.into_values() {
            let _ = child.kill();
        }
    }

    fn insert(&self, job_id: String, child: CommandChild) -> bool {
        let mut state = self.state.lock().unwrap();

        if state.cancelled_jobs.remove(&job_id) {
            let _ = child.kill();
            return false;
        }

        state.children.insert(job_id, child);
        true
    }

    fn remove(&self, job_id: &str) {
        let mut state = self.state.lock().unwrap();
        state.children.remove(job_id);
        state.cancelled_jobs.remove(job_id);
    }

    fn take_cancelled(&self, job_id: &str) -> bool {
        self.state.lock().unwrap().cancelled_jobs.remove(job_id)
    }
}

#[derive(Debug)]
enum SystemFfmpegStartError {
    NotFound(String),
    Other(String),
}

pub async fn run_ffmpeg(
    app: &tauri::AppHandle,
    job_id: &str,
    args: &[String],
) -> Result<FfmpegOutput, String> {
    let sidecar_error = match run_bundled_ffmpeg(app, job_id, args).await {
        Ok(output) => return Ok(output),
        Err(error) => error,
    };

    match run_system_ffmpeg(app, job_id, args).await {
        Ok(output) => Ok(output),
        Err(SystemFfmpegStartError::NotFound(error)) => Err(format!(
            "FFmpeg engine missing. Tried bundled sidecar ffmpeg first ({sidecar_error}), then system ffmpeg on PATH ({error}). Add a bundled FFmpeg sidecar or install FFmpeg and make sure the ffmpeg command is available on PATH."
        )),
        Err(SystemFfmpegStartError::Other(error)) => Err(format!(
            "Could not start FFmpeg engine. Bundled sidecar failed: {sidecar_error}. System ffmpeg failed: {error}"
        )),
    }
}

pub fn stop_all_conversions(app: &tauri::AppHandle) {
    app.state::<RunningFfmpegProcesses>().kill_all();
    app.state::<SleepInhibitor>().release_all();
}

async fn run_bundled_ffmpeg(
    app: &tauri::AppHandle,
    job_id: &str,
    args: &[String],
) -> Result<FfmpegOutput, String> {
    let command = app
        .shell()
        .sidecar("ffmpeg")
        .map_err(|error| format!("sidecar is not configured or not bundled: {error}"))?
        .args(args.to_vec());

    run_tracked_ffmpeg(app, job_id, command, FfmpegSource::BundledSidecar)
        .await
        .map_err(|error| format!("sidecar could not be started: {error}"))
}

async fn run_system_ffmpeg(
    app: &tauri::AppHandle,
    job_id: &str,
    args: &[String],
) -> Result<FfmpegOutput, SystemFfmpegStartError> {
    let command = app.shell().command("ffmpeg").args(args.to_vec());

    run_tracked_ffmpeg(app, job_id, command, FfmpegSource::SystemPath)
        .await
        .map_err(|error| match error {
            tauri_plugin_shell::Error::Io(error)
                if error.kind() == std::io::ErrorKind::NotFound =>
            {
                SystemFfmpegStartError::NotFound("not found".to_string())
            }
            error => SystemFfmpegStartError::Other(error.to_string()),
        })
}

async fn run_tracked_ffmpeg(
    app: &tauri::AppHandle,
    job_id: &str,
    command: ShellCommand,
    source: FfmpegSource,
) -> Result<FfmpegOutput, tauri_plugin_shell::Error> {
    if app.state::<RunningFfmpegProcesses>().take_cancelled(job_id) {
        return Ok(cancelled_ffmpeg_output(source));
    }

    let (mut receiver, child) = command.spawn()?;
    if !app
        .state::<RunningFfmpegProcesses>()
        .insert(job_id.to_string(), child)
    {
        return Ok(cancelled_ffmpeg_output(source));
    }

    app.state::<SleepInhibitor>().acquire();

    let mut stdout = Vec::new();
    let mut stderr = Vec::new();
    let mut exit_code = None;
    let mut process_error = None;

    while let Some(event) = receiver.recv().await {
        match event {
            CommandEvent::Stdout(line) => {
                stdout.extend(line);
                stdout.push(b'\n');
            }
            CommandEvent::Stderr(line) => {
                stderr.extend(line);
                stderr.push(b'\n');
            }
            CommandEvent::Error(error) => {
                process_error = Some(error);
            }
            CommandEvent::Terminated(payload) => {
                exit_code = payload.code;
            }
            _ => {}
        }
    }

    app.state::<RunningFfmpegProcesses>().remove(job_id);
    app.state::<SleepInhibitor>().release();

    let status_label = exit_code
        .map(|code| code.to_string())
        .or_else(|| process_error.clone())
        .unwrap_or_else(|| "terminated".to_string());

    Ok(FfmpegOutput {
        source,
        success: exit_code == Some(0),
        status_label,
        stdout: String::from_utf8_lossy(&stdout).into_owned(),
        stderr: String::from_utf8_lossy(&stderr).into_owned(),
    })
}

fn cancelled_ffmpeg_output(source: FfmpegSource) -> FfmpegOutput {
    FfmpegOutput {
        source,
        success: false,
        status_label: "cancelled".to_string(),
        stdout: String::new(),
        stderr: "Conversion cancelled.".to_string(),
    }
}
