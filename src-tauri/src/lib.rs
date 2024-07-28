use cmds::BroadcastState;
use serde::{Deserialize, Serialize};


mod cmds;
pub mod error;


#[derive(Serialize,Deserialize,Clone)]
pub struct SystmEvent{
    pub title: String,
    pub description: String,
    pub datetime : chrono::NaiveDateTime
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(BroadcastState::new())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![cmds::scan, cmds::create_broadcast,cmds::cancel_broadcast])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
