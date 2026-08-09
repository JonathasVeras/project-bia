// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;
use tauri_plugin_global_shortcut::ShortcutState;

mod x11_focus;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcut("Alt+Shift+X")
                .expect("atalho inválido")
                .with_handler(|app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.unminimize();
                                let _ = window.show();
                                let _ = window.set_always_on_top(true);
                                let win = window.clone();
                                std::thread::spawn(move || {
                                    std::thread::sleep(std::time::Duration::from_millis(150));
                                    let _ = win.set_focus();
                                    x11_focus::focus_window(&win);
                                    let _ = win.request_user_attention(None);
                                });
                            }
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            x11_focus::init();
            #[cfg(target_os = "linux")]
            if let Some(window) = app.get_webview_window("main") {
                if let Ok(gtk_win) = window.gtk_window() {
                    use gtk::prelude::*;
                    gtk_win.set_focus_on_map(true);
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}