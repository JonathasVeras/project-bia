# 🎮 AI Game Companion - Project Context

## 📌 Visão Geral do Projeto
O objetivo deste projeto é criar um aplicativo desktop ultra-leve que atua como um copiloto inteligente de gameplay. Ele roda silenciosamente em segundo plano e, ao ser acionado por um atalho global, captura instantaneamente a tela do jogo e abre um *overlay* minimalista. Utilizando a API de visão de uma LLM (como Gemini 1.5 Pro ou Claude 3.5 Sonnet), o assistente lê a tela atual e ajuda o jogador em tempo real, eliminando a necessidade de usar *Alt+Tab* para consultar wikis pesadas.

## 🛠️ Stack Tecnológica
* **Core / Engine Desktop:** Tauri (v2) - Utilizado para garantir baixo consumo de RAM e não impactar o FPS dos jogos. Compila o backend em Rust.
* **Frontend:** React com Vite - Sem StrictMode para evitar conflitos de ciclo de vida com os eventos do sistema operacional.
* **Estilização:** Tailwind CSS (v4) - Usado para criar uma interface de chat escura, translúcida e moderna.
* **Ambiente de Desenvolvimento Principal:** Linux Mint (com alvo de compilação prioritária final para Windows).

## 🎯 Casos de Uso Alvo
A ferramenta é construída para auxiliar em diversos cenários, como:
* Otimizar a produção da fazenda, gerenciar presentes para NPCs e completar coleções do museu em *Stardew Valley*.
* Rastrear requisitos complexos para conquistas específicas, como a "Tracer" na franquia *Watch Dogs*.
* Analisar a tela durante diálogos densos para entender as consequências das escolhas narrativas em *Cyberpunk 2077* ou *Red Dead Redemption*.

## 🏗️ Estado Atual e Arquitetura (O que já foi feito)
O projeto superou a fase de *setup* inicial e já possui a base do overlay configurada:
1. **Janela Nativa:** Configurada no `tauri.conf.json` com `"decorations": false` e `"transparent": true` para atuar como um overlay sem bordas do sistema.
2. **Interface de Chat:** O frontend em React (`App.tsx`) possui um layout funcional de chat, com input de texto, renderização condicional de mensagens (User vs. Assistant) e *auto-scroll* implementado.
3. **Comunicação IPC:** O frontend consegue invocar comandos do backend nativo em Rust.
4. **Atalho Global (WIP):** Implementação da lógica de Show/Hide usando o `@tauri-apps/plugin-global-shortcut`. A janela busca escutar atalhos (ex: `Alt+Shift+X`) para alternar sua visibilidade (`appWindow.show()` / `appWindow.hide()`) e focar no input de texto automaticamente.

## 🚧 Desafios Técnicos Recentes
* **Conflitos de Atalho no Linux:** Lidando com a interceptação de teclas no gerenciador de janelas (Cinnamon/X11 vs Wayland). O atalho precisa desviar das configurações nativas do sistema para registrar corretamente no Tauri.
* **Ciclo de Vida do React:** O `React.StrictMode` precisou ser desativado no `main.tsx` para evitar que os hooks de registro de atalho do Tauri fossem disparados duas vezes, o que causava *deadlocks* silenciosos no motor Rust.

