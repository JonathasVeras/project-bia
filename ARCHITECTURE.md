# Arquitetura do Projeto BIA

## Visão Geral

O BIA é um **overlay de desktop Tauri v2** que funciona como um assistente de IA para jogos. Ele fica por cima dos jogos (always-on-top, sem decoração, transparente), captura a tela sob demanda com `Alt+L`, e envia screenshots para o Gemini 3.6-flash para análise.

---

## Fluxo de Arquivos

```
index.html (ponto de entrada HTML)
    │
    ▼
src/main.tsx (monta o React, sem StrictMode)
    │
    ▼
src/App.tsx (componente principal)
    ├── ThemeProvider (src/themes/ThemeContext.tsx)
    │     ├── themes.ts (define 5 temas com ~28 variáveis CSS cada)
    │     └── ThemeToggle.tsx (dropdown na titlebar)
    │
    ├── UI do chat (mensagens, input, toggle de screenshot)
    │
    └── handleSend() → chama ai-pipeline.ts
              │
              ├── src/lib/capture.ts → invoke("capture_screen_to_base64")
              │         ↓ (IPC Tauri)
              │   src-tauri/src/capture.rs
              │         ├── hide window
              │         ├── screenshot com xcap
              │         ├── resize + JPEG encode
              │         └── retorna base64
              │
              └── src/lib/gemini.ts → @google/genai SDK
                        ↓
                  Gemini 3.6-flash (cloud)
```

---

## Fluxo Completo: Usuário Envia Mensagem

```
1. Usuário digita prompt → clica Enviar
2. App.tsx: handleSend()
3. Se withScreenshot=true:
   → captureAndAnalyze(prompt, apiKey)
   → capture.ts: invoke("capture_screen_to_base64")  ← IPC para Rust
   → capture.rs: esconde janela, captura tela, processa imagem
   → gemini.ts: analyzeImage(base64, prompt)
   → Retorna texto da análise
4. Se withScreenshot=false + histórico:
   → sendWithContext(prompt, history, apiKey)
   → gemini.ts: analyzeWithHistory()
5. Se withScreenshot=false + sem histórico:
   → sendTextOnly(prompt, apiKey)
   → gemini.ts: analyzeText()
6. Resultado → Message(role:'assistant') → renderiza com Markdown
```

---

## Backend Rust

```
src-tauri/src/main.rs
    └── project_bia_lib::run()

src-tauri/src/lib.rs (core do Tauri)
    ├── Registra plugin global-shortcut (Alt+L)
    │     └── Toggle show/hide + foco X11
    ├── Registra comando IPC: capture_screen_to_base64
    └── Setup: x11_focus::init()

src-tauri/src/capture.rs
    └── capture_screen_to_base64()
          ├── hide window
          ├── tokio::sleep(200ms)
          ├── xcap: captura monitor primário
          ├── resize (se > 1280px)
          ├── RGBA → RGB → JPEG (quality 80)
          └── base64 encode

src-tauri/src/x11_focus.rs
    └── Foco X11 via FFI (Xlib)
          ├── focus_once(xid): _NET_ACTIVE_WINDOW, XRaiseWindow, XSetInputFocus
          └── focus_window(): tenta 5x com 100ms delay
```

---

## Temas

- **themes.ts** define 5 temas: `win95`, `lofi`, `fruit-aero`, `nostalgia-2000`, `modern`
- Cada tema tem ~28 variáveis CSS (`--bg`, `--text`, `--titlebar-gradient`, etc.)
- **ThemeContext.tsx** aplica as variáveis no `document.documentElement.style` e salva no `localStorage`
- **ThemeToggle.tsx** é o dropdown customizado na titlebar
- **App.css** usa as variáveis CSS em todos os componentes

---

## Fluxo do Atalho Global (Alt+L)

```
Pressiona Alt+L
    ↓
Rust: lib.rs handler
    ↓
Se janela visível → window.hide()
Se janela oculta →
    window.unminimize()
    window.show()
    window.set_always_on_top(true)
    thread spawn (150ms delay):
        window.set_focus()
        x11_focus::focus_window()  ← 5 tentativas X11
        window.request_user_attention()
```

---

## Dependências Principais

### Frontend (NPM)

| Pacote | Versão | Finalidade |
|--------|--------|------------|
| `react` | ^19.1.0 | Framework UI |
| `react-dom` | ^19.1.0 | Renderer DOM |
| `@google/genai` | ^2.16.0 | Cliente API Gemini |
| `@tauri-apps/api` | ^2 | Bridge IPC Tauri |
| `@tauri-apps/plugin-global-shortcut` | ^2.3.2 | Atalhos globais |
| `react-markdown` | ^10.1.0 | Renderizar Markdown |

### Backend (Rust/Cargo)

| Crate | Versão | Finalidade |
|-------|--------|------------|
| `tauri` | 2 | Framework Tauri |
| `tauri-plugin-global-shortcut` | 2 | Plugin de atalhos |
| `xcap` | 0.1 | Captura de tela cross-platform |
| `image` | 0.25 | Processamento de imagem |
| `base64` | 0.22 | Encoding base64 |
| `tokio` | 1 | Runtime async |
| `gtk` | 0.18 | Bindings GTK (Linux) |
| `raw-window-handle` | 0.6 | Acesso a handles de janela |

---

## Pontos Importantes para Estudar

1. **`src/App.tsx`** — O coração da UI. Todo o estado do chat, input, mensagens, e orquestração ficam aqui
2. **`src/lib/ai-pipeline.ts`** — Camada intermediária que conecta capture + gemini
3. **`src/lib/gemini.ts`** — Cliente da API do Gemini (3 modos: imagem, texto, com histórico)
4. **`src/lib/capture.ts`** — Wrapper do IPC (só tem 1 função: `captureScreenAsBase64()`)
5. **`src-tauri/src/capture.rs`** — Implementação real da captura de tela
6. **`src-tauri/src/lib.rs`** — Bootstrap do Tauri, plugins, e comando IPC
7. **`src/themes/themes.ts`** — Definições visuais de cada tema

---

## Configurações Importantes

### tauri.conf.json
- Janela: 420x900px, posição (0,0), sem decoração, transparente, always-on-top
- Dev server: `localhost:1420`
- CSP: `null` (permissivo — necessário para chamadas à API Gemini)

### tsconfig.json
- Target: ES2020, React JSX transform
- Strict mode habilitado

### vite.config.ts
- Plugins: React + Tailwind CSS
- Dev server na porta 1420 (porta fixa)
