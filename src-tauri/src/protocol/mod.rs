pub mod bytes_serializable;
pub mod command;
use bytes::{BufMut, Bytes, BytesMut};
use bytes_serializable::BytesSerializable;
use command::ServerCommand;
use serde::{Deserialize, Serialize};
use serde_with::base64::Base64;
use serde_with::serde_as;
use std::fmt::Display;

use crc::{Crc, CRC_16_MODBUS};
pub const MODBUS: Crc<u16> = Crc::<u16>::new(&CRC_16_MODBUS);

const PREFIX: u16 = 0xFEFE;
const VERSION: u8 = 0x01;
const RESERVE: u32 = 0xFFFFFFFF;

#[serde_as]
#[derive(Debug, Serialize, Deserialize)]
pub struct Packet {
    version: u8,
    device_type: u8,
    device_mac: u64,
    msg_id: u64,
    status: u8,
    command: ServerCommand,

}

pub trait Command: BytesSerializable + Send + Sync + Display  {
    fn code(&self) -> u16;
}
impl Packet {

    pub fn  new(device_type: u8, device_mac: u64, msg_id: u64, command:  ServerCommand) -> Self {
        Self {
            version: VERSION,
            device_type,
            device_mac,
            msg_id,
            status: 0xFF,
            command,
        }
    }

    pub fn as_bytes(&self,) -> Bytes {
        let payload = self.command.to_bytes();
        let mut bytes = BytesMut::with_capacity(26 + payload.len());
        bytes.put_u16(PREFIX);
        bytes.put_u8(self.version);
        bytes.put_u8(self.device_type);
        bytes.put_u64(self.device_mac);
        bytes.put_u32(RESERVE);
        bytes.put_u64(self.msg_id);
        bytes.put_u8(self.status);
        bytes.put_slice(&payload);
        let crc = MODBUS.checksum(&bytes);
        bytes.put_u16(crc);
        bytes.freeze()
    }
}
