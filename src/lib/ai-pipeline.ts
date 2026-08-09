import { captureScreenAsBase64 } from "./capture";
import {
  analyzeImage,
  analyzeText,
  analyzeWithHistory,
  ChatMessage,
} from "./gemini";

export interface PipelineResult {
  screenshotBase64?: string;
  analysis: string;
  timestamp: number;
}

const MODEL = "gemini-3.6-flash";

export async function captureAndAnalyze(
  prompt: string
): Promise<PipelineResult> {
  const screenshotBase64 = await captureScreenAsBase64();

  const result = await analyzeImage(screenshotBase64, prompt, {
    model: MODEL,
    mimeType: "image/jpeg",
  });

  return {
    screenshotBase64,
    analysis: result.text,
    timestamp: Date.now(),
  };
}

export async function sendTextOnly(prompt: string): Promise<PipelineResult> {
  const result = await analyzeText(prompt, {
    model: MODEL,
  });

  return {
    analysis: result.text,
    timestamp: Date.now(),
  };
}

export async function sendWithContext(
  prompt: string,
  history: ChatMessage[]
): Promise<PipelineResult> {
  const messages: ChatMessage[] = [
    ...history,
    { role: "user", text: prompt },
  ];

  const result = await analyzeWithHistory(messages, {
    model: MODEL,
  });

  return {
    analysis: result.text,
    timestamp: Date.now(),
  };
}
