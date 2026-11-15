use tauri::{Manager, PhysicalPosition, PhysicalSize};

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

/// ช่วยให้หน้าต่างหลักไม่ล้นออกนอกจอเมื่อเปิดโปรแกรม
fn fit_and_center_main_window(app: &tauri::AppHandle) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };

    let monitor = match window.current_monitor() {
        Ok(Some(monitor)) => monitor,
        Ok(None) => match window.primary_monitor() {
            Ok(Some(monitor)) => monitor,
            Ok(None) => return,
            Err(_) => return,
        },
        Err(_) => return,
    };

    let scale = monitor.scale_factor();
    let work_area = monitor.work_area();

    // set_size ควบคุมพื้นที่เนื้อหาด้านใน ส่วนขอบและแถบชื่อเรื่องถูกคำนวณเพิ่ม
    // เพื่อให้หน้าต่างทั้งบานอยู่ภายในพื้นที่ใช้งานของจอและอยู่กึ่งกลางพอดี
    let (outer_size, inner_size) = match (window.outer_size(), window.inner_size()) {
        (Ok(outer), Ok(inner)) => (outer, inner),
        _ => return,
    };
    let decoration_width = outer_size.width.saturating_sub(inner_size.width);
    let decoration_height = outer_size.height.saturating_sub(inner_size.height);
    let margin = (24.0 * scale).round().max(0.0) as u32;
    let max_inner_width = work_area
        .size
        .width
        .saturating_sub(margin.saturating_mul(2).saturating_add(decoration_width))
        .max(1);
    let max_inner_height = work_area
        .size
        .height
        .saturating_sub(margin.saturating_mul(2).saturating_add(decoration_height))
        .max(1);
    let inner_width = ((1280.0 * scale).round() as u32)
        .min(max_inner_width)
        .max(1);
    let inner_height = ((900.0 * scale).round() as u32)
        .min(max_inner_height)
        .max(1);

    if window
        .set_size(PhysicalSize::new(inner_width, inner_height))
        .is_err()
    {
        return;
    }

    let outer_size = match window.outer_size() {
        Ok(size) => size,
        Err(_) => return,
    };
    let x =
        work_area.position.x + ((work_area.size.width.saturating_sub(outer_size.width)) / 2) as i32;
    let y = work_area.position.y
        + ((work_area.size.height.saturating_sub(outer_size.height)) / 2) as i32;
    let _ = window.set_position(PhysicalPosition::new(x, y));
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // จัดขนาดและตำแหน่งก่อนแสดงหน้าต่าง เพื่อไม่ให้เห็นหน้าต่างกระโดดตอนเปิดโปรแกรม
            fit_and_center_main_window(app.handle());
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![save_text_file, pick_import_file])
        .run(tauri::generate_context!())
        .expect("error while running BerkKong");
}
