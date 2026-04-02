use crate::config::{get_api_key, set_api_key};
use crate::db::{get_db, Conversation, Message, QuickCommand};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tauri::command;
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse {
    pub content: String,
}

#[command]
pub fn get_conversations() -> Result<Vec<Conversation>, String> {
    let db = get_db().lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare("SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;

    let conversations = stmt
        .query_map([], |row| {
            Ok(Conversation {
                id: row.get(0)?,
                title: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(conversations)
}

#[command]
pub fn create_conversation(title: String) -> Result<Conversation, String> {
    let db = get_db().lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    db.execute(
        "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
        [&id, &title, &now, &now],
    )
    .map_err(|e| e.to_string())?;

    Ok(Conversation {
        id,
        title,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[command]
pub fn delete_conversation(id: String) -> Result<(), String> {
    let db = get_db().lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM messages WHERE conversation_id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    db.execute("DELETE FROM conversations WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub fn get_messages(conversation_id: String) -> Result<Vec<Message>, String> {
    let db = get_db().lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare("SELECT id, conversation_id, role, content, created_at FROM messages WHERE conversation_id = ?1 ORDER BY created_at ASC")
        .map_err(|e| e.to_string())?;

    let messages = stmt
        .query_map([&conversation_id], |row| {
            Ok(Message {
                id: row.get(0)?,
                conversation_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(messages)
}

#[command]
pub async fn send_message(conversation_id: String, content: String) -> Result<Message, String> {
    // Get API key
    let api_key = get_api_key().ok_or("API key not set")?;

    // Save user message
    let db = get_db().lock().map_err(|e| e.to_string())?;
    let msg_id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    db.execute(
        "INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        [&msg_id, &conversation_id, "user", &content, &now],
    )
    .map_err(|e| e.to_string())?;

    // Update conversation timestamp
    db.execute(
        "UPDATE conversations SET updated_at = ?1 WHERE id = ?2",
        [&now, &conversation_id],
    )
    .map_err(|e| e.to_string())?;

    // Get conversation history for context
    let mut stmt = db
        .prepare("SELECT role, content FROM messages WHERE conversation_id = ?1 ORDER BY created_at ASC")
        .map_err(|e| e.to_string())?;

    let history: Vec<(String, String)> = stmt
        .query_map([&conversation_id], |row| Ok((row.get(0)?, row.get(1)?)))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    // Build messages for Claude API
    let claude_messages: Vec<serde_json::Value> = history
        .into_iter()
        .map(|(role, content)| {
            serde_json::json!({
                "role": if role == "user" { "user" } else { "assistant" },
                "content": content
            })
        })
        .collect();

    // Call Claude API
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|_| format!("Failed to create HTTP client"))?;
    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", &api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&serde_json::json!({
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 4096,
            "messages": claude_messages
        }))
        .send()
        .await
        .map_err(|_| format!("Failed to call Claude API"))?;

    // Validate HTTP status
    if !response.status().is_success() {
        let status = response.status();
        let _body = response.text().await.unwrap_or_default();
        return Err(format!("API error: {}", status));
    }

    let response_json: serde_json::Value = response
        .json()
        .await
        .map_err(|_| format!("Failed to parse response"))?;

    let blocks = response_json["content"]
        .as_array()
        .ok_or("Invalid response from Claude API")?;

    // Check for error blocks in the response
    for block in blocks {
        if block["type"].as_str() == Some("error") {
            let _error_msg = block["text"].as_str().unwrap_or("Unknown error");
            return Err("Claude API returned an error".to_string());
        }
    }

    let assistant_content = blocks
        .first()
        .and_then(|block| block["text"].as_str())
        .ok_or("Invalid response from Claude API")?
        .to_string();

    // Save assistant message
    let db = get_db().lock().map_err(|e| e.to_string())?;
    let assistant_id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    db.execute(
        "INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        [&assistant_id, &conversation_id, "assistant", &assistant_content, &now],
    )
    .map_err(|e| e.to_string())?;

    Ok(Message {
        id: assistant_id,
        conversation_id,
        role: "assistant".to_string(),
        content: assistant_content,
        created_at: now,
    })
}

#[command]
pub fn get_commands() -> Result<Vec<QuickCommand>, String> {
    let db = get_db().lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare("SELECT id, name, prompt FROM quick_commands")
        .map_err(|e| e.to_string())?;

    let commands = stmt
        .query_map([], |row| {
            Ok(QuickCommand {
                id: row.get(0)?,
                name: row.get(1)?,
                prompt: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(commands)
}

#[command]
pub fn add_command(name: String, prompt: String) -> Result<QuickCommand, String> {
    let db = get_db().lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();

    db.execute(
        "INSERT INTO quick_commands (id, name, prompt) VALUES (?1, ?2, ?3)",
        [&id, &name, &prompt],
    )
    .map_err(|e| e.to_string())?;

    Ok(QuickCommand { id, name, prompt })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Settings {
    pub api_key_set: bool,
}

#[command]
pub fn get_settings() -> Result<Settings, String> {
    let api_key_set = get_api_key().is_some();
    Ok(Settings { api_key_set })
}

#[command]
pub fn save_settings(api_key: String) -> Result<(), String> {
    set_api_key(&api_key)
}
