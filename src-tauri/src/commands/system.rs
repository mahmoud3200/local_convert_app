use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;

#[tauri::command]
pub fn open_external_url(app: AppHandle, url: String) -> Result<(), String> {
    if !url.starts_with("https://") && !url.starts_with("http://") {
        return Err("Only HTTP and HTTPS URLs can be opened.".to_string());
    }

    #[allow(deprecated)]
    app.shell()
        .open(url, None)
        .map_err(|error| format!("Could not open external URL: {error}"))
}
