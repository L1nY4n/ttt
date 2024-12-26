use serde::{Deserialize, Serialize};
use tauri::Manager;
mod cmds;
pub mod error;
mod protocol;
#[cfg(desktop)]
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
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("logs".to_string()),
                    },
                ))
                .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_persisted_scope::init())
        .manage(cmds::broadcast::BroadcastState::new())
     
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            app.manage(cmds::ble::State::new(app.app_handle().clone()));
           
            #[cfg(desktop)]
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
            cmds::ble::mqtt_create_client,
            cmds::ble::mqtt_close_client,
            cmds::ble::mqtt_publish,
            cmds::ble::mqtt_state,
            cmds::ble::update_light,
        ]);

    #[cfg(desktop)]
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
                cmds::ble::mqtt_create_client,
                cmds::ble::mqtt_close_client,
                cmds::ble::mqtt_publish,
                cmds::ble::mqtt_state,
                cmds::ble::update_light,
                cmds::serialport::write_port,
                cmds::serialport::available_ports,
                cmds::serialport::open_port,
                cmds::serialport::close_port,
                cmds::serialport::write_port,
                cmds::check_update
            ]);
    }

    {
        builder = builder
            .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
            .plugin(tauri_plugin_process::init())
            .plugin(tauri_plugin_updater::Builder::new().build())
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
