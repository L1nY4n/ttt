use tauri::Manager;
pub mod broadcast;
pub mod mqtt;
pub mod qr_ac;

#[cfg(not(target_os = "ios"))]
pub mod serialport;





#[tauri::command]
pub fn check_update(app: tauri::AppHandle) {
    let webview = app.get_webview_window("update").unwrap();
    let _ = webview.show();
    let _ = webview.set_focus();
}

