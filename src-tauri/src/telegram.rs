use std::collections::HashMap;
use std::sync::Mutex;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;

use serde::Deserialize;
use serde_json::{Value, json};
use tauri::{AppHandle, Emitter, Manager, Runtime};
use tauri_plugin_store::StoreExt;
use tokio::sync::oneshot;

use crate::agent::AGENT_EVENT;
use crate::secrets;

const API: &str = "https://api.telegram.org";
const CONFIG_FILE: &str = "config.json";
const CONFIG_EVENT: &str = "agent://config";
const POLL_TIMEOUT: u64 = 30;
const RESULT_TIMEOUT: Duration = Duration::from_secs(10);

#[derive(Default)]
pub struct Pending {
    next: AtomicU64,
    waiting: Mutex<HashMap<u64, oneshot::Sender<Value>>>,
}

#[tauri::command]
pub fn agent_result(state: tauri::State<'_, Pending>, id: u64, result: Value) {
    if let Some(tx) = state.waiting.lock().unwrap().remove(&id) {
        let _ = tx.send(result);
    }
}

#[derive(Deserialize)]
struct Resp<T> {
    ok: bool,
    result: Option<T>,
    description: Option<String>,
}

#[derive(Deserialize)]
struct Update {
    update_id: i64,
    message: Option<Message>,
}

#[derive(Deserialize)]
struct Message {
    chat: Chat,
    text: Option<String>,
}

#[derive(Deserialize)]
struct Chat {
    id: i64,
}

pub fn spawn_poller<R: Runtime>(app: AppHandle<R>) {
    app.manage(Pending::default());
    tauri::async_runtime::spawn(async move {
        let http = reqwest::Client::builder()
            .timeout(Duration::from_secs(POLL_TIMEOUT + 10))
            .build()
            .expect("cliente http");
        let mut backoff = 5;
        loop {
            let token = match (agent_enabled(&app), secrets::bot_token()) {
                (true, Some(t)) => t,
                _ => {
                    tokio::time::sleep(Duration::from_secs(3)).await;
                    continue;
                }
            };
            match poll_once(&app, &http, &token).await {
                Ok(()) => backoff = 5,
                Err(e) => {
                    eprintln!("[telegram] {e}");
                    tokio::time::sleep(Duration::from_secs(backoff)).await;
                    backoff = (backoff * 2).min(60);
                }
            }
        }
    });
}

async fn poll_once<R: Runtime>(app: &AppHandle<R>, http: &reqwest::Client, token: &str) -> Result<(), String> {
    let offset = read_offset(app);
    let updates: Vec<Update> = call(
        http,
        token,
        "getUpdates",
        json!({ "offset": offset, "timeout": POLL_TIMEOUT, "allowed_updates": ["message"] }),
    )
    .await?;

    for u in updates {
        write_offset(app, u.update_id + 1);
        if let Some(msg) = u.message {
            handle_message(app, http, token, msg).await;
        }
    }
    Ok(())
}

async fn handle_message<R: Runtime>(app: &AppHandle<R>, http: &reqwest::Client, token: &str, msg: Message) {
    let chat = msg.chat.id.to_string();
    let text = msg.text.unwrap_or_default();
    let authorized = config_value(app, "chatId").and_then(|v| v.as_str().map(String::from));

    match authorized {
        None if text.trim().starts_with("/start") => {
            set_config_value(app, "chatId", json!(chat));
            let _ = app.emit(CONFIG_EVENT, ());
            send(http, token, &chat, "Pronto! Este chat está autorizado. Me mande suas tarefas, uma por linha. Use \"amanhã:\" no começo da linha para agendar para amanhã.").await;
            return;
        }
        Some(ref c) if *c == chat => {}
        _ => return,
    }

    if text.trim().starts_with('/') {
        return;
    }
    let cmds = to_commands(&text);
    if cmds.is_empty() {
        send(http, token, &chat, "Só entendo mensagens de texto por enquanto.").await;
        return;
    }

    let reply = match dispatch(app, cmds).await {
        Some(result) => format_reply(&result),
        None => "Não consegui falar com o app. A janela está aberta?".into(),
    };
    send(http, token, &chat, &reply).await;
}

fn to_commands(text: &str) -> Vec<Value> {
    let today = chrono::Local::now().date_naive();
    let tomorrow = today.succ_opt().unwrap_or(today);
    text.lines()
        .filter_map(|line| {
            let line = line.trim();
            let lower = line.to_lowercase();
            let (date, rest) = ["amanhã:", "amanha:"]
                .iter()
                .find(|p| lower.starts_with(*p))
                .map(|p| (tomorrow, line[p.len()..].trim()))
                .unwrap_or((today, line));
            (!rest.is_empty()).then(|| {
                json!({ "type": "add_task", "text": rest, "date": date.format("%Y-%m-%d").to_string() })
            })
        })
        .collect()
}

async fn dispatch<R: Runtime>(app: &AppHandle<R>, cmds: Vec<Value>) -> Option<Value> {
    let pending = app.state::<Pending>();
    let id = pending.next.fetch_add(1, Ordering::Relaxed);
    let (tx, rx) = oneshot::channel();
    pending.waiting.lock().unwrap().insert(id, tx);

    if app.emit(AGENT_EVENT, json!({ "id": id, "cmds": cmds })).is_err() {
        pending.waiting.lock().unwrap().remove(&id);
        return None;
    }
    let result = tokio::time::timeout(RESULT_TIMEOUT, rx).await.ok()?.ok();
    pending.waiting.lock().unwrap().remove(&id);
    result
}

fn format_reply(result: &Value) -> String {
    let empty = vec![];
    let applied = result["applied"].as_array().unwrap_or(&empty);
    let rejected = result["rejected"].as_array().unwrap_or(&empty);
    let mut lines: Vec<String> = applied
        .iter()
        .map(|c| format!("✓ {}{}", c["text"].as_str().unwrap_or(""), when(c)))
        .collect();
    lines.extend(rejected.iter().map(|r| {
        let text: String = r["cmd"]["text"].as_str().unwrap_or("").chars().take(40).collect();
        format!("✗ {} — {}", text, r["reason"].as_str().unwrap_or("recusada"))
    }));
    if lines.is_empty() { "Nada foi adicionado.".into() } else { lines.join("\n") }
}

fn when(cmd: &Value) -> &'static str {
    let today = chrono::Local::now().date_naive().format("%Y-%m-%d").to_string();
    if cmd["date"].as_str() == Some(today.as_str()) { "" } else { " (amanhã)" }
}

async fn call<T: for<'de> Deserialize<'de>>(
    http: &reqwest::Client,
    token: &str,
    method: &str,
    body: Value,
) -> Result<T, String> {
    let url = format!("{API}/bot{token}/{method}");
    let resp: Resp<T> = http
        .post(url)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.without_url().to_string())?
        .json()
        .await
        .map_err(|e| e.without_url().to_string())?;
    match (resp.ok, resp.result) {
        (true, Some(r)) => Ok(r),
        _ => Err(resp.description.unwrap_or_else(|| format!("{method} falhou"))),
    }
}

async fn send(http: &reqwest::Client, token: &str, chat: &str, text: &str) {
    if let Err(e) = call::<Value>(http, token, "sendMessage", json!({ "chat_id": chat, "text": text })).await {
        eprintln!("[telegram] sendMessage: {e}");
    }
}

fn config_value<R: Runtime>(app: &AppHandle<R>, key: &str) -> Option<Value> {
    let store = app.store(CONFIG_FILE).ok()?;
    store.get("agent")?.get(key).cloned().filter(|v| !v.is_null())
}

fn set_config_value<R: Runtime>(app: &AppHandle<R>, key: &str, value: Value) {
    let Ok(store) = app.store(CONFIG_FILE) else { return };
    let mut agent = store.get("agent").filter(Value::is_object).unwrap_or_else(|| json!({}));
    agent[key] = value;
    store.set("agent", agent);
    let _ = store.save();
}

fn agent_enabled<R: Runtime>(app: &AppHandle<R>) -> bool {
    config_value(app, "agentEnabled").and_then(|v| v.as_bool()).unwrap_or(false)
}

fn read_offset<R: Runtime>(app: &AppHandle<R>) -> i64 {
    app.store(CONFIG_FILE)
        .ok()
        .and_then(|s| s.get("telegramOffset"))
        .and_then(|v| v.as_i64())
        .unwrap_or(0)
}

fn write_offset<R: Runtime>(app: &AppHandle<R>, offset: i64) {
    if let Ok(store) = app.store(CONFIG_FILE) {
        store.set("telegramOffset", json!(offset));
        let _ = store.save();
    }
}
