#[derive(serde::Serialize)]
struct PickedTextFile {
    name: String,
    content: String,
}

#[tauri::command]
async fn pick_import_file() -> Result<Option<PickedTextFile>, String> {
    let file = rfd::AsyncFileDialog::new()
        .set_title("นำเข้าไฟล์ BerkKong")
        .add_filter("JSON", &["json"])
        .pick_file()
        .await;

    let Some(file) = file else {
        return Ok(None);
    };

    let path = file.path().to_path_buf();
    let name = path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("berkkong-import.json")
        .to_string();
    let content = std::fs::read_to_string(&path).map_err(|error| error.to_string())?;

    Ok(Some(PickedTextFile { name, content }))
}

#[tauri::command]
async fn save_text_file(default_name: String, content: String) -> Result<Option<String>, String> {
    let file = rfd::AsyncFileDialog::new()
        .set_title("บันทึกไฟล์ BerkKong")
        .set_file_name(&default_name)
        .save_file()
        .await;

    if let Some(file) = file {
        std::fs::write(file.path(), content.as_bytes()).map_err(|error| error.to_string())?;
        Ok(Some(file.path().to_string_lossy().to_string()))
    } else {
        Ok(None)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![save_text_file, pick_import_file])
        .run(tauri::generate_context!())
        .expect("error while running BerkKong");
}
