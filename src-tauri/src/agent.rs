pub const AGENT_EVENT: &str = "agent://commands";

#[cfg(debug_assertions)]
#[tauri::command]
pub fn debug_inject(app: tauri::AppHandle, cmds: serde_json::Value) -> Result<(), String> {
    use tauri::Emitter;
    app.emit(AGENT_EVENT, serde_json::json!({ "id": null, "cmds": cmds }))
        .map_err(|e| e.to_string())
}
