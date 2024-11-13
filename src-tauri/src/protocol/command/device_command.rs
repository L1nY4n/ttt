




use std::fmt::Display;

use bytes::{BufMut, BytesMut};

use serde::{Deserialize, Serialize};

use crate::protocol::{bytes_serializable::BytesSerializable, command::broadcast_scan::Scan, Command};

use crate::protocol::command::device_msg::DeviceInfo;

use super::SCAN;




#[derive(Debug,Serialize,Deserialize)]
pub enum DeviceCommand {
    Info(DeviceInfo),
}



impl Display for DeviceCommand {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "DeviceCommand")
    }
}

impl Command for DeviceCommand {
    fn code(&self) -> u16 {
        match self {
            DeviceCommand::Info(info) => SCAN,
        }
    }
}
impl BytesSerializable for DeviceCommand {
    fn to_bytes(&self) -> bytes::Bytes {
        let cmd_bytes = match self {
            DeviceCommand::Info(info) => info.to_bytes(),
        };
        let mut bytes = BytesMut::with_capacity(cmd_bytes.len() + 2);
        bytes.put_u16(self.code());
        bytes.put_slice(&cmd_bytes);
        bytes.freeze()
    }

    fn from_bytes(bytes: bytes::Bytes) -> Result<Self, crate::error::Error>
    where
        Self: Sized,
    {
        let code = u16::from_be_bytes(bytes[0..2].try_into().unwrap());
        let len = u16::from_be_bytes(bytes[2..4].try_into().unwrap());
        let cmd_bytes = bytes.slice(4..(4 + len as usize));
        match code {
            SCAN => Ok(DeviceCommand::Info(DeviceInfo::from_bytes(cmd_bytes)?)),
            _ => Err(crate::error::Error::InvalidCommand),
        }
    }
}

