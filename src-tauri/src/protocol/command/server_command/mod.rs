use std::fmt::Display;

use broadcast_scan::Scan;
use bytes::{BufMut, Bytes, BytesMut};

use network_set::NetworkSet;
use reboot::Reboot;
use serde::{Deserialize, Serialize};
use tcp_server_set::TcpServerSet;

use crate::protocol::{bytes_serializable::BytesSerializable, Command};

use super::{NETWORK_SET, REBOOT, SCAN, TCP_SERVER_SET};

pub mod broadcast_scan;
pub mod network_set;
pub mod reboot;
pub mod tcp_server_set;

#[derive(Debug, Serialize, Deserialize)]
pub enum ServerCommand {
    Scan(Scan),
    NetworkSet(NetworkSet),
    TcpServerSet(TcpServerSet),
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
            ServerCommand::NetworkSet(network_set) => network_set.code(),
            ServerCommand::TcpServerSet(tcp_server_set) => tcp_server_set.code(),
            ServerCommand::Reboot(reboot) => reboot.code(),
        }
    }
}
impl BytesSerializable for ServerCommand {
    fn to_bytes(&self) -> bytes::Bytes {
        let cmd_bytes = match self {
            ServerCommand::Scan(scan) => scan.to_bytes(),
            ServerCommand::NetworkSet(network_set) => network_set.to_bytes(),
            ServerCommand::TcpServerSet(tcp_server_set) => tcp_server_set.to_bytes(),
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
            NETWORK_SET => Ok(ServerCommand::NetworkSet(NetworkSet::from_bytes(
                cmd_bytes,
            )?)),
            TCP_SERVER_SET => Ok(ServerCommand::TcpServerSet(TcpServerSet::from_bytes(
                cmd_bytes,
            )?)),
            REBOOT => Ok(ServerCommand::Reboot(Reboot::from_bytes(cmd_bytes)?)),
            _ => Err(crate::error::Error::NotImplement),
        }
    }
}
