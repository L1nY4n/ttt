use serde::{Deserialize, Serialize};
mod cmds;
pub mod error;
mod protocol;
pub mod tray;

#[derive(Serialize, Deserialize, Clone)]
pub struct SystmEvent {
    pub title: String,
    pub description: String,
    pub datetime: chrono::NaiveDateTime,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(cmds::broadcast::BroadcastState::new())
        .manage(cmds::mqtt::State::new())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            tray::create_tray(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            cmds::broadcast::check_broadcast,
            cmds::broadcast::create_broadcast,
            cmds::broadcast::cancel_broadcast,
            cmds::broadcast::scan,
            cmds::broadcast::network_set,
            cmds::broadcast::tcp_server_set,
            cmds::broadcast::reboot,
            cmds::mqtt::mqtt_create_client,
            cmds::mqtt::mqtt_close_client,
            cmds::mqtt::mqtt_publish,
            cmds::mqtt::mqtt_state
        ]);

    #[cfg(not(target_os = "ios"))]
    {
        builder = builder
            .manage(cmds::serialport::State::new())
            .invoke_handler(tauri::generate_handler![
                cmds::broadcast::check_broadcast,
                cmds::broadcast::create_broadcast,
                cmds::broadcast::cancel_broadcast,
                cmds::broadcast::scan,
                cmds::broadcast::network_set,
                cmds::broadcast::tcp_server_set,
                cmds::broadcast::reboot,
                cmds::mqtt::mqtt_create_client,
                cmds::mqtt::mqtt_close_client,
                cmds::mqtt::mqtt_publish,
                cmds::mqtt::mqtt_state,
                cmds::serialport::write_port,
                cmds::serialport::available_ports,
                cmds::serialport::open_port,
                cmds::serialport::close_port,
                cmds::serialport::write_port
            ]);
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
