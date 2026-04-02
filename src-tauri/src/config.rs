use keyring::Entry;

pub fn get_api_key() -> Option<String> {
    let entry = Entry::new("claude-desktop", "api_key").ok()?;
    entry.get_password().ok()
}

pub fn set_api_key(key: &str) -> Result<(), String> {
    let entry = Entry::new("claude-desktop", "api_key")
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
    entry
        .set_password(key)
        .map_err(|e| format!("Failed to save API key: {}", e))
}

pub fn get_model() -> Option<String> {
    let entry = Entry::new("claude-desktop", "model").ok()?;
    entry.get_password().ok()
}

pub fn set_model(model: &str) -> Result<(), String> {
    let entry = Entry::new("claude-desktop", "model")
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
    entry
        .set_password(model)
        .map_err(|e| format!("Failed to save model: {}", e))
}
