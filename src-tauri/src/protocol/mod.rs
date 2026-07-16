pub mod bytes_serializable;
pub mod command;
use crate::protocol::command::ServerCommand;
use bytes::{BufMut, Bytes, BytesMut};
use bytes_serializable::BytesSerializable;
use command::DeviceCommand;
use serde::{Deserialize, Serialize};

use serde_with::serde_as;
use std::fmt::Display;
use std::sync::atomic::{AtomicU64, Ordering};

use crc::{Crc, CRC_16_MODBUS};
pub const MODBUS: Crc<u16> = Crc::<u16>::new(&CRC_16_MODBUS);

const PREFIX: u16 = 0xFEFE;
const VERSION: u8 = 0x01;
const RESERVE: u32 = 0xFFFFFFFF;
const MIN_PACKET_LEN: usize = 29;
const HEADER_LEN_BEFORE_PAYLOAD: usize = 23;

static MSG_ID: AtomicU64 = AtomicU64::new(1);

pub fn next_msg_id() -> u64 {
    MSG_ID.fetch_add(1, Ordering::Relaxed)
}

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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::protocol::bytes_serializable::BytesSerializable;
    use crate::protocol::command::{
        base::{network::IpWithPort, MqttConfig, Network},
        device_command::device_msg::DeviceInfo,
        server_command::{mqtt_set::MqttSet, ServerCommand},
        DeviceCommand, Scan,
    };

    #[test]
    fn scan_request_matches_document_frame_layout() {
        let msg_id = 0x0102_0304_0506_0708;
        let packet =
            Packet::new_server_cmd(0, u64::MAX, msg_id, ServerCommand::Scan(Scan::default()));

        let bytes = packet.as_bytes();
        assert_eq!(&bytes[0..2], &[0xFE, 0xFE]);
        assert_eq!(u16::from_be_bytes(bytes[2..4].try_into().unwrap()), 27);
        assert_eq!(bytes[4], 0x01);
        assert_eq!(bytes[5], 0x00);
        assert_eq!(&bytes[6..14], &[0xFF; 8]);
        assert_eq!(&bytes[14..18], &[0xFF; 4]);
        assert_eq!(
            u64::from_be_bytes(bytes[18..26].try_into().unwrap()),
            msg_id
        );
        assert_eq!(bytes[26], 0xFF);
        assert_eq!(&bytes[27..31], &[0x00, 0x00, 0x00, 0x00]);

        let parsed = Packet::from_bytes(bytes).unwrap();
        assert!(matches!(
            parsed.command,
            PacketCommand::ServerCommand(ServerCommand::Scan(_))
        ));
    }

    #[test]
    fn parses_scan_response_network_and_extension_bytes() {
        let network = Network::new(
            1,
            "192.168.1.20".parse().unwrap(),
            "192.168.1.1".parse().unwrap(),
            "255.255.255.0".parse().unwrap(),
            "8.8.8.8".parse().unwrap(),
        );
        let info = DeviceInfo {
            network: network.clone(),
            extra: vec![0xAA, 0x55],
        };
        let packet = Packet::new_device_cmd(
            0x06,
            0x0000_4436_333A_7700,
            9,
            DeviceCommand::ScanResp(info),
        );

        let parsed = Packet::from_bytes(packet.as_bytes()).unwrap();
        match parsed.command {
            PacketCommand::DeviceCommand(DeviceCommand::ScanResp(info)) => {
                assert_eq!(info.network, network);
                assert_eq!(info.extra, vec![0xAA, 0x55]);
            }
            other => panic!("unexpected command: {other:?}"),
        }
    }

    #[test]
    fn tcp_server_config_uses_ipv4_and_big_endian_port() {
        let target = IpWithPort::new("10.0.0.8".parse().unwrap(), 6000);
        let bytes = target.to_bytes();
        assert_eq!(&bytes[..], &[10, 0, 0, 8, 0x17, 0x70]);
        assert_eq!(IpWithPort::from_bytes(bytes).unwrap(), target);
    }

    #[test]
    fn mqtt_config_roundtrips_document_payload() {
        let config = MqttConfig::new(
            "10.0.0.2".parse().unwrap(),
            1883,
            30,
            "/dev/sub".to_string(),
            "user".to_string(),
            "pass".to_string(),
            "client-1".to_string(),
        );

        let bytes = config.to_bytes();
        assert_eq!(&bytes[0..8], &[10, 0, 0, 2, 0x07, 0x5B, 0x00, 0x1E]);
        assert_eq!(MqttConfig::from_bytes(bytes).unwrap(), config);
    }

    #[test]
    fn mqtt_set_command_uses_document_command_code() {
        let config = MqttConfig::new(
            "10.0.0.2".parse().unwrap(),
            1883,
            0,
            "/sub".to_string(),
            "".to_string(),
            "".to_string(),
            "".to_string(),
        );
        let command = ServerCommand::MqttSet(MqttSet {
            mqtt_config: config,
        });
        let bytes = command.to_bytes();
        assert_eq!(&bytes[0..4], &[0x01, 0x22, 0x00, 0x10]);

        let parsed = ServerCommand::from_bytes(bytes).unwrap();
        assert!(matches!(parsed, ServerCommand::MqttSet(_)));
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
        let len = HEADER_LEN_BEFORE_PAYLOAD + payload.len();
        let mut bytes = BytesMut::with_capacity(len + 6);
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
        if bytes.len() < MIN_PACKET_LEN {
            return Err(crate::error::Error::InvalidCommand);
        }
        match bytes.as_ref() {
            [body @ .., crc_h, crc_low]
                if (body[0] as u16 * 0x100) + (body[1] as u16) == PREFIX
                    && MODBUS.checksum(&body) == ((*crc_h as u16) << 8) | *crc_low as u16 =>
            {
                let mut position = 2;

                let len = u16::from_be_bytes(body[position..position + 2].try_into().unwrap());
                position += 2;
                if len as usize != body.len() - 4 {
                    return Err(crate::error::Error::InvalidCommand);
                }

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
