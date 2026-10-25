use std::{fs, path::PathBuf};

use crate::types::{NativeFileMetadata, NativePathExistence};

#[tauri::command]
pub fn get_native_file_metadata(paths: Vec<String>) -> Result<Vec<NativeFileMetadata>, String> {
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
pub fn check_native_paths(paths: Vec<String>) -> Result<Vec<NativePathExistence>, String> {
    Ok(paths
        .into_iter()
        .map(|path| NativePathExistence {
            exists: PathBuf::from(&path).is_file(),
            path,
        })
        .collect())
}
