use serde::{Deserialize, Serialize};
mod cmds;
mod protocol;
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
        .manage(cmds::broadcast::BroadcastState::new())
        .manage(cmds::serialport::State::new())
        .manage(cmds::mqtt::State::new())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            cmds::broadcast::create_broadcast,
            cmds::broadcast::cancel_broadcast,
            cmds::broadcast::scan,

            cmds::serialport::available_ports,
            cmds::serialport::open_port,
            cmds::serialport::close_port,  
            cmds::serialport::write_port,

            cmds::mqtt::mqtt_create_client,
            cmds::mqtt::mqtt_close_client,
            cmds::mqtt::mqtt_publish,
            cmds::mqtt::mqtt_state
            ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
