use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertFileRequest {
    pub job_id: String,
    pub file_name: String,
    pub kind: MediaKind,
    pub output_format: String,
    pub options: ConvertOptions,
    pub bytes: Vec<u8>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertFilePathRequest {
    pub job_id: String,
    pub input_path: String,
    pub file_name: String,
    pub kind: MediaKind,
    pub output_format: String,
    pub options: ConvertOptions,
}

#[derive(Debug)]
pub struct ConversionJob {
    pub job_id: String,
    pub file_name: String,
    pub kind: MediaKind,
    pub output_format: String,
    pub options: ConvertOptions,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CopyGeneratedOutputRequest {
    pub source_path: String,
    pub target_path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ZipGeneratedOutputsRequest {
    pub target_path: String,
    pub outputs: Vec<ZipGeneratedOutputEntry>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ZipGeneratedOutputEntry {
    pub source_path: String,
    pub file_name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeFileMetadata {
    pub path: String,
    pub file_name: String,
    pub size: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NativePathExistence {
    pub path: String,
    pub exists: bool,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum MediaKind {
    Image,
    Audio,
    Video,
}

#[derive(Debug, Default, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ConvertOptions {
    pub quality: Option<u8>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub fps: Option<u32>,
    pub bitrate: Option<String>,
    pub sample_rate: Option<u32>,
    pub channels: Option<u8>,
    pub remove_metadata: Option<bool>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertFileResponse {
    pub bytes: Vec<u8>,
    pub file_name: String,
    pub mime_type: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertFilePathResponse {
    pub native_path: String,
    pub file_name: String,
    pub mime_type: String,
}

#[derive(Debug)]
pub struct ConvertedOutputInfo {
    pub file_name: String,
    pub mime_type: String,
}

impl From<&ConvertFileRequest> for ConversionJob {
    fn from(request: &ConvertFileRequest) -> Self {
        Self {
            job_id: request.job_id.clone(),
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
            job_id: request.job_id,
            file_name: request.file_name,
            kind: request.kind,
            output_format: request.output_format,
            options: request.options,
        }
    }
}
