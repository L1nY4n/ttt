pub mod bytes_serializable;
pub mod command;
use crate::protocol::command::ServerCommand;
use bytes::{BufMut, Bytes, BytesMut};
use bytes_serializable::BytesSerializable;
use command::DeviceCommand;
use serde::{Deserialize, Serialize};

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
    pub version: u8,
    pub device_type: u8,
    pub device_mac: u64,
    pub msg_id: u64,
    pub status: u8,
    pub command: PacketCommand,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum PacketCommand {
    ServerCommand(ServerCommand),
    DeviceCommand(DeviceCommand),
}

impl PacketCommand {
    pub fn to_bytes(&self) -> Bytes {
        match self {
            PacketCommand::ServerCommand(server_command) => server_command.to_bytes(),
            PacketCommand::DeviceCommand(device_command) => device_command.to_bytes(),
        }
    }

    pub fn from_bytes(bytes: Bytes) -> Result<Self, crate::error::Error> {
        if bytes.len() < 4 {
            return Err(crate::error::Error::InvalidCommand);
        }
        let code = u16::from_be_bytes(bytes[0..2].try_into().unwrap());

        if code % 2 == 0 {
            Ok(PacketCommand::ServerCommand(ServerCommand::from_bytes(
                bytes,
            )?))
        } else {
            Ok(PacketCommand::DeviceCommand(DeviceCommand::from_bytes(
                bytes,
            )?))
        }
    }
}

impl Display for PacketCommand {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "PacketCommand")
    }
}

pub trait Command: BytesSerializable + Send + Sync + Display {
    fn code(&self) -> u16;
}
impl Packet {
    pub fn new_server_cmd(
        device_type: u8,
        device_mac: u64,
        msg_id: u64,
        command: ServerCommand,
    ) -> Self {
        Self {
            version: VERSION,
            device_type,
            device_mac,
            msg_id,
            status: 0xFF,
            command: PacketCommand::ServerCommand(command),
        }
    }

    pub fn new_device_cmd(
        device_type: u8,
        device_mac: u64,
        msg_id: u64,
        command: DeviceCommand,
    ) -> Self {
        Self {
            version: VERSION,
            device_type,
            device_mac,
            msg_id,
            status: 0xFF,
            command: PacketCommand::DeviceCommand(command),
        }
    }

    pub fn as_bytes(&self) -> Bytes {
        let payload = self.command.to_bytes();
        println!("command: {} {:02X}", self.command, payload);
        let len = 26 + 1 + payload.len();
        let mut bytes = BytesMut::with_capacity(len + 2);
        bytes.put_u16(PREFIX);
        bytes.put_u16(len.try_into().unwrap());
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

    pub fn from_bytes(bytes: Bytes) -> Result<Self, crate::error::Error> {
        match bytes.as_ref() {
            [body @ .., crc_h, crc_low]
                if (body[0] as u16 * 0x100) + (body[1] as u16) == PREFIX
                    && MODBUS.checksum(&body) == ((*crc_h as u16) << 8) | *crc_low as u16 =>
            {
                let mut position = 2;

                let len = u16::from_be_bytes(body[position..position + 2].try_into().unwrap());
                position += 2;

                let version = body[position];
                position += 1;

                let device_type = body[position];
                position += 1;

                let device_mac =
                    u64::from_be_bytes(body[position..position + 8].try_into().unwrap());
                position += 8;

                let _reserve = u32::from_be_bytes(body[position..position + 4].try_into().unwrap());
                position += 4;

                let msg_id = u64::from_be_bytes(body[position..position + 8].try_into().unwrap());
                position += 8;

                let status = body[position];
                position += 1;

                println!("Packet decode  --- len: {}, version: {}, device_type: {}, device_mac: {:X}, reserve: {:X}, msg_id: {:X}, status: {}", len, version, device_type, device_mac, _reserve, msg_id, status);

                let command = PacketCommand::from_bytes(Bytes::copy_from_slice(&body[position..]))?;
                Ok(Packet {
                    version,
                    device_type,
                    device_mac,
                    msg_id,
                    status,
                    command,
                })
            }
            _ => {
                return Err(crate::error::Error::InvalidCommand);
            }
        }
    }
}
