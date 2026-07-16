use std::fmt::Display;

use bytes::{BufMut, Bytes, BytesMut};

use serde::{Deserialize, Serialize};

use crate::protocol::{
    bytes_serializable::BytesSerializable,
    command::{
        base::{network::IpWithPort, MqttConfig},
        MQTT_GET_RESP, MQTT_SET_RESP, NETWORK_GET_RESP, NETWORK_SET_RESP, REBOOT_RESP, SCAN_RESP,
        TCP_SERVER_GET_RESP, TCP_SERVER_SET_RESP,
    },
    Command,
};

use device_msg::DeviceInfo;

pub mod device_msg;

#[derive(Debug, Serialize, Deserialize)]
pub enum DeviceCommand {
    ScanResp(DeviceInfo),
    NetworkGetResp(DeviceInfo),
    NetworkSetResp,
    TcpServerGetResp(IpWithPort),
    TcpServerSetResp,
    MqttGetResp(MqttConfig),
    MqttSetResp,
    RebootResp,
}

impl Display for DeviceCommand {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "DeviceCommand")
    }
}

impl Command for DeviceCommand {
    fn code(&self) -> u16 {
        match self {
            DeviceCommand::ScanResp(_) => SCAN_RESP,
            DeviceCommand::NetworkGetResp(_) => NETWORK_GET_RESP,
            DeviceCommand::NetworkSetResp => NETWORK_SET_RESP,
            DeviceCommand::TcpServerGetResp(_) => TCP_SERVER_GET_RESP,
            DeviceCommand::TcpServerSetResp => TCP_SERVER_SET_RESP,
            DeviceCommand::MqttGetResp(_) => MQTT_GET_RESP,
            DeviceCommand::MqttSetResp => MQTT_SET_RESP,
            DeviceCommand::RebootResp => REBOOT_RESP,
        }
    }
}
impl BytesSerializable for DeviceCommand {
    fn to_bytes(&self) -> bytes::Bytes {
        let cmd_bytes = match self {
            DeviceCommand::ScanResp(info) => info.to_bytes(),
            DeviceCommand::NetworkGetResp(info) => info.to_bytes(),
            DeviceCommand::NetworkSetResp => Bytes::new(),
            DeviceCommand::TcpServerGetResp(ip_and_port) => ip_and_port.to_bytes(),
            DeviceCommand::TcpServerSetResp => Bytes::new(),
            DeviceCommand::MqttGetResp(mqtt_config) => mqtt_config.to_bytes(),
            DeviceCommand::MqttSetResp => Bytes::new(),
            DeviceCommand::RebootResp => Bytes::new(),
        };
        let cmd_len = cmd_bytes.len();
        let mut bytes = BytesMut::with_capacity(cmd_len + 4);
        bytes.put_u16(self.code());
        bytes.put_u16(cmd_len.try_into().unwrap());
        bytes.put_slice(&cmd_bytes);
        bytes.freeze()
    }

    fn from_bytes(bytes: bytes::Bytes) -> Result<Self, crate::error::Error>
    where
        Self: Sized,
    {
        println!("device command hex:   {:02X}", bytes);
        let code = u16::from_be_bytes(bytes[0..2].try_into().unwrap());
        let len = u16::from_be_bytes(bytes[2..4].try_into().unwrap());
        let cmd_bytes = if len == 0 {
            Bytes::new()
        } else {
            bytes.slice(4..(4 + len as usize))
        };
        match code {
            SCAN_RESP => Ok(DeviceCommand::ScanResp(DeviceInfo::from_bytes(cmd_bytes)?)),
            NETWORK_GET_RESP => Ok(DeviceCommand::NetworkGetResp(DeviceInfo::from_bytes(
                cmd_bytes,
            )?)),
            NETWORK_SET_RESP => Ok(DeviceCommand::NetworkSetResp),
            TCP_SERVER_GET_RESP => Ok(DeviceCommand::TcpServerGetResp(IpWithPort::from_bytes(
                cmd_bytes,
            )?)),
            TCP_SERVER_SET_RESP => Ok(DeviceCommand::TcpServerSetResp),
            MQTT_GET_RESP => Ok(DeviceCommand::MqttGetResp(MqttConfig::from_bytes(
                cmd_bytes,
            )?)),
            MQTT_SET_RESP => Ok(DeviceCommand::MqttSetResp),
            REBOOT_RESP => Ok(DeviceCommand::RebootResp),
            _ => Err(crate::error::Error::NotImplement),
        }
    }
}
