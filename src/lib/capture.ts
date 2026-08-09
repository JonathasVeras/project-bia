import { invoke } from "@tauri-apps/api/core";

/**
 * Captura a tela ativa e retorna como base64 PNG.
 */
export async function captureScreenAsBase64(): Promise<string> {
  return invoke<string>("capture_screen_to_base64");
}
