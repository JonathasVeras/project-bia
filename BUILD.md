# Guia de Build - Instalador BIA

## Pré-requisitos

| Ferramenta | Versão | Instalação |
|------------|--------|------------|
| Node.js | LTS (18+) | https://nodejs.org |
| Rust | stable | https://rustup.rs |
| Git | latest | https://git-scm.com |

### Linux (dependências extras)

```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

---

## Gerar instalador local

### Windows

```bash
npm install
npm run tauri build
```

Artefatos gerados em `src-tauri/target/release/bundle/`:
- `nsis/project-bia_*_x64-setup.exe` → Instalador NSIS
- `msi/project-bia_*_x64.msi` → Instalador MSI

### Linux

```bash
npm install
npm run tauri build
```

Artefatos gerados em `src-tauri/target/release/bundle/`:
- `deb/project-bia_*_amd64.deb` → Pacote Debian
- `appimage/project-bia_*_amd64.AppImage` → AppImage portátil

---

## Publicar nova versão (via GitHub Actions)

### 1. Atualizar versão em 3 arquivos

| Arquivo | Campo | Exemplo |
|---------|-------|---------|
| `package.json` | `"version"` | `"0.2.0"` |
| `src-tauri/tauri.conf.json` | `"version"` | `"0.2.0"` |
| `src-tauri/Cargo.toml` | `version` | `"0.2.0"` |

### 2. Commit e push

```bash
git add .
git commit -m "bump: v0.2.0"
git push
```

### 3. Criar tag (dispara o workflow)

```bash
git tag v0.2.0
git push origin v0.2.0
```

### 4. Aguardar build

- Acesse `github.com/JonathasVeras/project-bia/actions`
- Aguarde os jobs concluírem (~5-10 min)

### 5. Publicar release

- Acesse `github.com/JonathasVeras/project-bia/releases`
- Clique em **"Edit"** no draft
- Revise os notes e assets
- Clique em **"Publish release"**

---

## Build manual (sem GitHub Actions)

Se preferir gerar o instalador na sua máquina:

```bash
# Windows
npm run tauri build -- --target x86_64-pc-windows-msvc

# Linux
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

Os arquivos ficam em `src-tauri/target/<target>/release/bundle/`.

---

## Troubleshooting

| Erro | Solução |
|------|---------|
| `webkit2gtk not found` | Instalar dependências Linux (veja acima) |
| `rustup: command not found` | Instalar Rust via https://rustup.rs |
| `npm: command not found` | Instalar Node.js LTS |
| Build trava no Windows | Verificar se o WebView2 está instalado |
| Tag não dispara workflow | Verificar se a tag começa com `v` (ex: `v0.1.0`) |
