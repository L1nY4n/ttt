use std::fmt::Display;

use broadcast_scan::Scan;
use bytes::{BufMut, Bytes, BytesMut};

use mqtt_get::MqttGet;
use mqtt_set::MqttSet;
use network_get::NetworkGet;
use network_set::NetworkSet;
use reboot::Reboot;
use serde::{Deserialize, Serialize};
use tcp_server_get::TcpServerGet;
use tcp_server_set::TcpServerSet;

use crate::protocol::{bytes_serializable::BytesSerializable, Command};

use super::{
    MQTT_GET, MQTT_SET, NETWORK_GET, NETWORK_SET, REBOOT, SCAN, TCP_SERVER_GET, TCP_SERVER_SET,
};

pub mod broadcast_scan;
pub mod mqtt_get;
pub mod mqtt_set;
pub mod network_get;
pub mod network_set;
pub mod reboot;
pub mod tcp_server_get;
pub mod tcp_server_set;

#[derive(Debug, Serialize, Deserialize)]
pub enum ServerCommand {
    Scan(Scan),
    NetworkGet(NetworkGet),
    NetworkSet(NetworkSet),
    TcpServerGet(TcpServerGet),
    TcpServerSet(TcpServerSet),
    MqttGet(MqttGet),
    MqttSet(MqttSet),
    Reboot(Reboot),
}

impl Display for ServerCommand {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "ServerCommand")
    }
}

impl Command for ServerCommand {
    fn code(&self) -> u16 {
        match self {
            ServerCommand::Scan(scan) => scan.code(),
            ServerCommand::NetworkGet(network_get) => network_get.code(),
            ServerCommand::NetworkSet(network_set) => network_set.code(),
            ServerCommand::TcpServerGet(tcp_server_get) => tcp_server_get.code(),
            ServerCommand::TcpServerSet(tcp_server_set) => tcp_server_set.code(),
            ServerCommand::MqttGet(mqtt_get) => mqtt_get.code(),
            ServerCommand::MqttSet(mqtt_set) => mqtt_set.code(),
            ServerCommand::Reboot(reboot) => reboot.code(),
        }
    }
}
impl BytesSerializable for ServerCommand {
    fn to_bytes(&self) -> bytes::Bytes {
        let cmd_bytes = match self {
            ServerCommand::Scan(scan) => scan.to_bytes(),
            ServerCommand::NetworkGet(network_get) => network_get.to_bytes(),
            ServerCommand::NetworkSet(network_set) => network_set.to_bytes(),
            ServerCommand::TcpServerGet(tcp_server_get) => tcp_server_get.to_bytes(),
            ServerCommand::TcpServerSet(tcp_server_set) => tcp_server_set.to_bytes(),
            ServerCommand::MqttGet(mqtt_get) => mqtt_get.to_bytes(),
            ServerCommand::MqttSet(mqtt_set) => mqtt_set.to_bytes(),
            ServerCommand::Reboot(reboot) => reboot.to_bytes(),
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
        let code = u16::from_be_bytes(bytes[0..2].try_into().unwrap());
        let len = u16::from_be_bytes(bytes[2..4].try_into().unwrap());
        let cmd_bytes = if len == 0 {
            Bytes::new()
        } else {
            bytes.slice(4..(4 + len as usize))
        };
        match code {
            SCAN => Ok(ServerCommand::Scan(Scan::from_bytes(cmd_bytes)?)),
            NETWORK_GET => Ok(ServerCommand::NetworkGet(NetworkGet::from_bytes(
                cmd_bytes,
            )?)),
            NETWORK_SET => Ok(ServerCommand::NetworkSet(NetworkSet::from_bytes(
                cmd_bytes,
            )?)),
            TCP_SERVER_GET => Ok(ServerCommand::TcpServerGet(TcpServerGet::from_bytes(
                cmd_bytes,
            )?)),
            TCP_SERVER_SET => Ok(ServerCommand::TcpServerSet(TcpServerSet::from_bytes(
                cmd_bytes,
            )?)),
            MQTT_GET => Ok(ServerCommand::MqttGet(MqttGet::from_bytes(cmd_bytes)?)),
            MQTT_SET => Ok(ServerCommand::MqttSet(MqttSet::from_bytes(cmd_bytes)?)),
            REBOOT => Ok(ServerCommand::Reboot(Reboot::from_bytes(cmd_bytes)?)),
            _ => Err(crate::error::Error::NotImplement),
        }
    }
}
