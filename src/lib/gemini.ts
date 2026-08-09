import { invoke } from "@tauri-apps/api/core";

export interface GeminiAnalysisResult {
  text: string;
  model: string;
}

export async function setApiKey(apiKey: string): Promise<void> {
  await invoke("set_gemini_api_key", { apiKey });
}

export async function analyzeImage(
  base64Image: string,
  prompt: string,
  options: {
    model?: string;
    mimeType?: string;
  }
): Promise<GeminiAnalysisResult> {
  return invoke<GeminiAnalysisResult>("gemini_analyze_image", {
    base64Image,
    prompt,
    model: options.model ?? "gemini-3.6-flash",
    mimeType: options.mimeType ?? "image/jpeg",
  });
}

export async function analyzeText(
  prompt: string,
  options: { model?: string }
): Promise<GeminiAnalysisResult> {
  return invoke<GeminiAnalysisResult>("gemini_analyze_text", {
    prompt,
    model: options.model ?? "gemini-3.6-flash",
  });
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

const MAX_HISTORY = 5;

export async function analyzeWithHistory(
  messages: ChatMessage[],
  options: { model?: string }
): Promise<GeminiAnalysisResult> {
  const recent = messages.slice(-MAX_HISTORY);
  return invoke<GeminiAnalysisResult>("gemini_analyze_with_history", {
    messages: recent,
    model: options.model ?? "gemini-3.6-flash",
  });
}
