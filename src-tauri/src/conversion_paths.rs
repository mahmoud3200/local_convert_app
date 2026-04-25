use std::{
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

pub fn create_work_dir() -> Result<PathBuf, String> {
    let unique_id = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| format!("System clock error: {error}"))?
        .as_nanos();
    let path =
        std::env::temp_dir().join(format!("local-convert-{}-{unique_id}", std::process::id()));

    fs::create_dir_all(&path)
        .map_err(|error| format!("Could not create a temporary conversion folder: {error}"))?;

    Ok(path)
}

pub fn get_file_extension(file_name: &str) -> String {
    Path::new(file_name)
        .extension()
        .and_then(|extension| extension.to_str())
        .map(normalize_format)
        .filter(|extension| !extension.is_empty())
        .unwrap_or_else(|| "bin".to_string())
}

pub fn build_output_name(file_name: &str, output_format: &str) -> String {
    let stem = Path::new(file_name)
        .file_stem()
        .and_then(|stem| stem.to_str())
        .unwrap_or("converted");

    format!("{}.{}", sanitize_file_stem(stem), output_format)
}

pub fn normalize_format(value: &str) -> String {
    value.trim().trim_start_matches('.').to_ascii_lowercase()
}

pub fn path_arg(path: &Path) -> String {
    path.to_string_lossy().into_owned()
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
