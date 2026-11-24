use keyring::Entry;

const SERVICE: &str = "com.confereai.app";
const BOT_TOKEN: &str = "telegram_bot_token";

fn entry() -> Result<Entry, String> {
    Entry::new(SERVICE, BOT_TOKEN).map_err(|e| e.to_string())
}

pub fn bot_token() -> Option<String> {
    entry().ok()?.get_password().ok().filter(|t| !t.is_empty())
}

// Não existe comando que devolva o token ao JavaScript: ele só sai do cofre dentro do Rust.
#[tauri::command]
pub fn set_bot_token(token: String) -> Result<(), String> {
    let token = token.trim();
    if token.is_empty() {
        return Err("token vazio".into());
    }
    entry()?.set_password(token).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clear_bot_token() -> Result<(), String> {
    match entry()?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn has_bot_token() -> bool {
    bot_token().is_some()
}
