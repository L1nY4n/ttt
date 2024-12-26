use std::collections::HashMap;

use chrono::NaiveDateTime;
use rumqttc::tokio_rustls::rustls::version;
use serde::Deserialize;
use serde_json::Value;

use crate::error::Error;
// 定义 Message 类型
#[derive(Debug, Deserialize)]
pub struct Message {
    pub opcode: u8,
    pub mesh_dev_type: Option<u32>,
    pub value: Option<Value>,
    pub version: Option<Value>,
    pub dest_addr: Option<u16>,
    pub src_addr: Option<u16>,
    pub ota_data_index: Option<u32>,
    pub ota_pack_count: Option<u32>,
    pub ota_byte_size: Option<u32>,
    pub ota_total_size: Option<u32>,
    pub ipaddr: Option<String>,
    pub netmask: Option<String>,
    pub gateway: Option<String>,
    pub mqtt_addr: Option<String>,
    pub mqtt_port: Option<u32>,
    pub mqtt_username: Option<String>,
    pub mqtt_password: Option<String>,
    pub mqtt_subscribe_topic: Option<String>,
    pub running_duration: Option<u32>,
    pub light_on_duration: Option<u32>,
    pub power: Option<u32>,
    pub energy_consumption: Option<u32>,
    pub dev_model: Option<String>,
    pub dev_id: Option<String>,
    // pub value_array: Option<Vec<Value>>,
    pub array_total_size: Option<u32>,
    pub index_from: Option<u32>,
    pub index_to: Option<u32>,
    pub group_addr: Option<u32>,
    pub duration_begin: Option<u32>,
}

#[repr(u8)]
pub enum OpType {
    GW_OTA_START = 0x040,
    GW_OTA_START_ACK = 0x041,
    GW_OTA_DATA = 0x042,
    BLE_OTA_START = 0x43,
    BLE_OTA_START_ACK = 0x044,
    BLE_OTA_DATA = 0x045,
    GW_INFO_REQ = 0x46,
    GW_INFO_ACK = 0x47,
    GW_NET_CONFIG_REQ = 0x48,
    GW_NET_CONFIG_ACK = 0x49,
    GW_MQTT_CONFIG_REQ = 0x4a,
    GW_MQTT_CONFIG_ACK = 0x4b,
    GW_REBOOT_REQ = 0x4c,
    GW_REBOOT_ACK = 0x4d,
    GW_MESH_REQ = 0x4e,
    GW_MESH_ACK = 0x4f,
    BLE_LIST_REQ = 0x50,
    BLE_LIST_ACK = 0x51,
    GW_DNS_CONFIG_REQ = 0x52,
    GW_DNS_CONFIG_ACK = 0x53,
    GW_HEATBEAT_DATA = 0x56,
    LIGHT_SET_BRIGHTNESS = 0x01,
    LIGHT_SET_ONOFF = 0x05,
    LIGHT_OTA_START = 0x11,
    LIGHT_OTA_START_ACK = 0x12,
    LIGHT_INFO_REQ = 0x1c,
    LIGHT_INFO_ACK = 0x1d,
    LIGHT_SET_OFF_DELAY = 0x15,
    LIGHT_SET_MODE = 0x17,
    LIGHT_SET_JOIN_ENABLE = 0x19,
    LIGHT_SET_HEATBEAT_INTERVAL = 0x1a,
    LIGHT_HEATBEAT_DATA = 0x1b,
    LIGHT_GROUP_REQ = 0x1e,
    LIGHT_GROUP_ACK = 0x1f,
    LIGHT_SCENE_SET = 0x20,
    LIGHT_SCENE_GET = 0x21,
    LIGHT_SCENE_ACK = 0x22,
    LIGHT_SCENE_MODIFY = 0x23,
    LIGHT_SCENE_DEL = 0x24,
    LIGHT_SCENE_QUERY = 0x25,
    LIGHT_SCENE_QUERY_ACK = 0x26,
    LIGHT_LINKAGE_STATE_SET = 0x27,
    LIGHT_ENERGY_INTERVAL = 0x0f,
    LIGHT_ENERGY_GET = 0x28,
    LIGHT_ENERGY_ACK = 0x29,
    LIGHT_LINKAGE_GROUP_STATE_SET = 0x30,
    LIGHT_LINKAGE_GROUP_STATE_GET = 0x31,
    LIGHT_LINKAGE_GROUP_STATE_ACK = 0x32,
    LIGHT_GROUP_SET = 0x33,
    LIGHT_LINKAGE_MODE_SET = 0x34,
    LIGHT_BEACON_TAG = 0x37,
}

pub struct DataProps {
    pub beacon: Option<HashMap<String, BeaconData>>,
    pub version: Option<String>,
    pub dev_model: Option<String>,
    pub dev_id: Option<String>,
}

#[derive(Debug, Clone)]
pub struct BeaconData {
    pub rssi: i32,
    pub battery: u8,
    pub date: NaiveDateTime,
}
#[derive(Debug, Clone)]
pub enum Packet {
    GatewayHeatbeat {
        model: String,
        id: String,
        ip: String,
        version: u8,
    },
    LightHeartbeat {
        light_addr: u16,
        status: u8,
        mode: u8,
        version: u8,
    },
    LightBeacon {
        light_addr: u16,
        beacons: Vec<(u32, i8, u8)>,
    },
}

pub fn handle_message(msg: Message) -> Result<Packet, Error> {
    match msg.opcode {
        val if val == OpType::GW_HEATBEAT_DATA as u8 => {
            // {opcode: 86, version: "17", dev_model: "Turbo GW-BM-TCP-1", dev_id: "02000016CB0A", ipaddr: "192.168.100.162"}
            let model = msg.dev_model.unwrap();
            let id = msg.dev_id.unwrap();
            let ip = msg.ipaddr.unwrap();
            let version: u8 = msg.version.unwrap().as_str().unwrap().parse().unwrap();

            Ok(Packet::GatewayHeatbeat {
                model,
                id,
                ip,
                version,
            })
        }

        val if val == OpType::LIGHT_HEATBEAT_DATA as u8 => {
            let v = msg.value.unwrap();
            let s = v.as_str().unwrap();
            let status = u8::from_str_radix(&s[..2], 16).unwrap();
            let mode = u8::from_str_radix(&s[2..4], 16).unwrap();
            let version = u8::from_str_radix(&s[4..6], 16).unwrap();
            Ok(Packet::LightHeartbeat {
                light_addr: msg.src_addr.unwrap(),
                status,
                mode,
                version,
            })
        }

        val if val == OpType::LIGHT_BEACON_TAG as u8 => {
            let v = msg.value.unwrap();
            let s = v.as_str().unwrap();
            let beacons: Vec<(u32, i8, u8)> = (0..s.len())
                .step_by(10)
                .map(|i| {
                    let id = u32::from_str_radix(&s[i..i + 6], 16).unwrap();
                    let rssi_u = u8::from_str_radix(&s[i + 6..i + 8], 16).unwrap();
                    let rssi = rssi_u as i8;
                    let battery = u8::from_str_radix(&s[i + 8..i + 10], 16).unwrap();
                    (id, rssi, battery)
                })
                .collect();
            let light_addr = msg.src_addr.unwrap();

            Ok(Packet::LightBeacon {
                light_addr,
                beacons,
            })
        }

        _ => Err(Error::UnImlemented(msg.opcode)),
    }
}
