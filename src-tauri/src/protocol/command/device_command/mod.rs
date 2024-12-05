use std::fmt::Display;

use bytes::{BufMut, Bytes, BytesMut};

use serde::{Deserialize, Serialize};

use crate::protocol::{
    bytes_serializable::BytesSerializable,
    command::{NETWORK_GET_RESP, SCAN_RESP},
    Command,
};

use device_msg::DeviceInfo;

pub mod device_msg;

#[derive(Debug, Serialize, Deserialize)]
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
            DeviceCommand::Info(_info) => SCAN_RESP,
        }
    }
}
impl BytesSerializable for DeviceCommand {
    fn to_bytes(&self) -> bytes::Bytes {
        let cmd_bytes = match self {
            DeviceCommand::Info(info) => info.to_bytes(),
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
            SCAN_RESP => Ok(DeviceCommand::Info(DeviceInfo::from_bytes(cmd_bytes)?)),
            NETWORK_GET_RESP => Ok(DeviceCommand::Info(DeviceInfo::from_bytes(cmd_bytes)?)),
            _ => Err(crate::error::Error::NotImplement),
        }
    }
}
