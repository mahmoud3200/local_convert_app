mod commands;
mod conversion_paths;
mod ffmpeg;
mod power;
mod types;

use tauri::{Manager, WindowEvent};

use crate::{
    commands::{
        conversion::{cancel_all_conversions, cancel_conversion, convert_file, convert_file_path},
        files::{check_native_paths, get_native_file_metadata, read_native_preview},
        output::{copy_generated_output, delete_generated_output, zip_generated_outputs},
        system::open_external_url,
    },
    ffmpeg::runner::{stop_all_conversions, RunningFfmpegProcesses},
    power::SleepInhibitor,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .manage(RunningFfmpegProcesses::default())
        .manage(SleepInhibitor::default())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .on_window_event(|window, event| {
            if matches!(event, WindowEvent::CloseRequested { .. }) {
                stop_all_conversions(window.app_handle());
            }
        })
        .invoke_handler(tauri::generate_handler![
            cancel_all_conversions,
            cancel_conversion,
            check_native_paths,
            convert_file,
            convert_file_path,
            copy_generated_output,
            delete_generated_output,
            get_native_file_metadata,
            open_external_url,
            read_native_preview,
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
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| match event {
        tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit => {
            stop_all_conversions(app_handle);
        }
        tauri::RunEvent::WindowEvent {
            event: WindowEvent::Destroyed,
            ..
        } => {
            stop_all_conversions(app_handle);
        }
        _ => {}
    });
}
