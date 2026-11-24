mod agent;
mod secrets;
mod telegram;

use tauri_plugin_autostart::MacosLauncher;
#[cfg(not(debug_assertions))]
use tauri_plugin_autostart::ManagerExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .setup(|app| {
            #[cfg(not(debug_assertions))]
            {
                let autostart = app.autolaunch();
                if !autostart.is_enabled().unwrap_or(false) {
                    let _ = autostart.enable();
                }
            }
            telegram::spawn_poller(app.handle().clone());
            Ok(())
        });

    #[cfg(debug_assertions)]
    let builder = builder.invoke_handler(tauri::generate_handler![
        agent::debug_inject,
        telegram::agent_result,
        secrets::set_bot_token,
        secrets::clear_bot_token,
        secrets::has_bot_token,
    ]);
    #[cfg(not(debug_assertions))]
    let builder = builder.invoke_handler(tauri::generate_handler![
        telegram::agent_result,
        secrets::set_bot_token,
        secrets::clear_bot_token,
        secrets::has_bot_token,
    ]);

    builder
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o ConfereAí");
}
