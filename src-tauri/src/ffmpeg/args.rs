use std::path::Path;

use crate::{
    conversion_paths::path_arg,
    types::{ConversionJob, ConvertOptions, MediaKind},
};

pub fn build_ffmpeg_args(
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

pub fn validate_output_format(kind: &MediaKind, output_format: &str) -> Result<(), String> {
    let is_allowed = match kind {
        MediaKind::Image => matches!(
            output_format,
            "png" | "jpg" | "jpeg" | "webp" | "gif" | "avif" | "bmp" | "tif" | "tiff"
        ),
        MediaKind::Audio => {
            matches!(
                output_format,
                "mp3" | "wav" | "aac" | "ogg" | "flac" | "m4a"
            )
        }
        MediaKind::Video => matches!(output_format, "mp4" | "webm" | "mov" | "mkv" | "avi"),
    };

    if is_allowed {
        Ok(())
    } else {
        Err(format!("Unsupported output format: {output_format}"))
    }
}

pub fn tail_message(stderr: &str) -> String {
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

pub fn get_mime_type(output_format: &str) -> &'static str {
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
