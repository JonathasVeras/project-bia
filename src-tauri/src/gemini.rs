use serde::{Deserialize, Serialize};
use std::sync::Mutex;

static API_KEY: Mutex<Option<String>> = Mutex::new(None);

#[derive(Serialize, Deserialize)]
pub struct GeminiRequest {
    pub model: String,
    pub contents: Vec<GeminiContent>,
}

#[derive(Serialize, Deserialize)]
pub struct GeminiContent {
    pub role: Option<String>,
    pub parts: Vec<GeminiPart>,
}

#[derive(Serialize, Deserialize)]
#[serde(untagged)]
pub enum GeminiPart {
    Text { text: String },
    InlineData { inline_data: GeminiInlineData },
}

#[derive(Serialize, Deserialize)]
pub struct GeminiInlineData {
    pub mime_type: String,
    pub data: String,
}

#[derive(Serialize, Deserialize)]
pub struct GeminiResponse {
    pub candidates: Option<Vec<GeminiCandidate>>,
}

#[derive(Serialize, Deserialize)]
pub struct GeminiCandidate {
    pub content: Option<GeminiContent>,
}

#[derive(Serialize)]
pub struct AnalysisResult {
    pub text: String,
    pub model: String,
}

fn get_api_key() -> Result<String, String> {
    let guard = API_KEY.lock().map_err(|e| e.to_string())?;
    guard.clone().ok_or_else(|| "API key não configurada".to_string())
}

#[tauri::command]
pub async fn set_gemini_api_key(api_key: String) -> Result<(), String> {
    let mut guard = API_KEY.lock().map_err(|e| e.to_string())?;
    *guard = Some(api_key);
    Ok(())
}

#[tauri::command]
pub async fn gemini_analyze_image(
    base64_image: String,
    prompt: String,
    model: Option<String>,
    mime_type: Option<String>,
) -> Result<AnalysisResult, String> {
    let api_key = get_api_key()?;
    let model = model.unwrap_or_else(|| "gemini-3.6-flash".to_string());
    let mime_type = mime_type.unwrap_or_else(|| "image/jpeg".to_string());

    let request = GeminiRequest {
        model: model.clone(),
        contents: vec![
            GeminiContent {
                role: None,
                parts: vec![GeminiPart::InlineData {
                    inline_data: GeminiInlineData {
                        mime_type,
                        data: base64_image,
                    },
                }],
            },
            GeminiContent {
                role: None,
                parts: vec![GeminiPart::Text { text: prompt }],
            },
        ],
    };

    let client = reqwest::Client::new();
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model, api_key
    );

    let response = client
        .post(&url)
        .json(&request)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let gemini_response: GeminiResponse = response.json().await.map_err(|e| e.to_string())?;

    let text = gemini_response
        .candidates
        .and_then(|c| c.into_iter().next())
        .and_then(|c| c.content)
        .and_then(|c| c.parts.into_iter().next())
        .map(|p| match p {
            GeminiPart::Text { text } => text,
            _ => String::new(),
        })
        .unwrap_or_default();

    Ok(AnalysisResult { text, model })
}

#[tauri::command]
pub async fn gemini_analyze_text(
    prompt: String,
    model: Option<String>,
) -> Result<AnalysisResult, String> {
    let api_key = get_api_key()?;
    let model = model.unwrap_or_else(|| "gemini-3.6-flash".to_string());

    let request = GeminiRequest {
        model: model.clone(),
        contents: vec![GeminiContent {
            role: None,
            parts: vec![GeminiPart::Text { text: prompt }],
        }],
    };

    let client = reqwest::Client::new();
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model, api_key
    );

    let response = client
        .post(&url)
        .json(&request)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let gemini_response: GeminiResponse = response.json().await.map_err(|e| e.to_string())?;

    let text = gemini_response
        .candidates
        .and_then(|c| c.into_iter().next())
        .and_then(|c| c.content)
        .and_then(|c| c.parts.into_iter().next())
        .map(|p| match p {
            GeminiPart::Text { text } => text,
            _ => String::new(),
        })
        .unwrap_or_default();

    Ok(AnalysisResult { text, model })
}

#[derive(Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub text: String,
}

#[tauri::command]
pub async fn gemini_analyze_with_history(
    messages: Vec<ChatMessage>,
    model: Option<String>,
) -> Result<AnalysisResult, String> {
    let api_key = get_api_key()?;
    let model = model.unwrap_or_else(|| "gemini-3.6-flash".to_string());

    let max_history = 5;
    let recent: Vec<&ChatMessage> = messages.iter().rev().take(max_history).rev().collect();

    let contents: Vec<GeminiContent> = recent
        .iter()
        .map(|m| GeminiContent {
            role: Some(m.role.clone()),
            parts: vec![GeminiPart::Text { text: m.text.clone() }],
        })
        .collect();

    let request = GeminiRequest {
        model: model.clone(),
        contents,
    };

    let client = reqwest::Client::new();
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model, api_key
    );

    let response = client
        .post(&url)
        .json(&request)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let gemini_response: GeminiResponse = response.json().await.map_err(|e| e.to_string())?;

    let text = gemini_response
        .candidates
        .and_then(|c| c.into_iter().next())
        .and_then(|c| c.content)
        .and_then(|c| c.parts.into_iter().next())
        .map(|p| match p {
            GeminiPart::Text { text } => text,
            _ => String::new(),
        })
        .unwrap_or_default();

    Ok(AnalysisResult { text, model })
}
