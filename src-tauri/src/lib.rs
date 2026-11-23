use tauri_plugin_autostart::MacosLauncher;
#[cfg(not(debug_assertions))]
use tauri_plugin_autostart::ManagerExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Store: lê/grava tasks.json no appDataDir.
        .plugin(tauri_plugin_store::Builder::new().build())
        // Autostart: no Windows escreve em HKCU\...\CurrentVersion\Run.
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .setup(|app| {
            // Só registra no build de release, para não colocar o exe de dev na inicialização.
            #[cfg(not(debug_assertions))]
            {
                let autostart = app.autolaunch();
                if !autostart.is_enabled().unwrap_or(false) {
                    let _ = autostart.enable();
                }
            }
            #[cfg(debug_assertions)]
            let _ = app; // em dev não mexe na inicialização do Windows
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o ConfereAí");
}
