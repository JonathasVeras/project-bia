use base64::{engine::general_purpose::STANDARD, Engine};
use image::{imageops, ImageEncoder, RgbImage};
use std::sync::Mutex;
use tauri::Manager;
use xcap::Monitor;

const MAX_WIDTH: u32 = 1280;
const JPEG_QUALITY: u8 = 80;

static PRE_CAPTURED: Mutex<Option<String>> = Mutex::new(None);

fn rgba_to_rgb(rgba: &image::RgbaImage) -> RgbImage {
    let raw = rgba.as_raw();
    let mut rgb_data = Vec::with_capacity((rgba.width() * rgba.height() * 3) as usize);
    for chunk in raw.chunks(4) {
        rgb_data.extend_from_slice(&chunk[..3]);
    }
    RgbImage::from_raw(rgba.width(), rgba.height(), rgb_data)
        .expect("Falha ao converter RGBA para RGB")
}

fn capture_and_encode() -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let monitor = monitors.first().ok_or("Nenhum monitor encontrado")?;
    let image = monitor.capture_image().map_err(|e| e.to_string())?;

    let resized = if image.width() > MAX_WIDTH {
        let ratio = MAX_WIDTH as f64 / image.width() as f64;
        let new_height = (image.height() as f64 * ratio) as u32;
        imageops::resize(&image, MAX_WIDTH, new_height, imageops::FilterType::Lanczos3)
    } else {
        image
    };

    let rgb = rgba_to_rgb(&resized);

    let mut jpeg_buffer = Vec::new();
    let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut jpeg_buffer, JPEG_QUALITY);
    encoder
        .write_image(
            rgb.as_raw(),
            rgb.width(),
            rgb.height(),
            image::ColorType::Rgb8.into(),
        )
        .map_err(|e| e.to_string())?;

    Ok(STANDARD.encode(jpeg_buffer))
}

pub fn capture_before_show() -> Result<String, String> {
    let base64 = capture_and_encode()?;
    let mut guard = PRE_CAPTURED.lock().map_err(|e| e.to_string())?;
    *guard = Some(base64.clone());
    Ok(base64)
}

pub fn take_pre_captured() -> Option<String> {
    let mut guard = PRE_CAPTURED.lock().ok()?;
    guard.take()
}

#[tauri::command]
pub async fn capture_screen_to_base64(app: tauri::AppHandle) -> Result<String, String> {
    if let Some(pre) = take_pre_captured() {
        return Ok(pre);
    }

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
        tokio::time::sleep(std::time::Duration::from_millis(200)).await;
    }

    let base64 = capture_and_encode()?;

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_always_on_top(true);
    }

    Ok(base64)
}
