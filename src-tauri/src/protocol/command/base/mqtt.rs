use std::net::Ipv4Addr;

use bytes::{BufMut, Bytes, BytesMut};
use serde::{Deserialize, Serialize};

use crate::protocol::bytes_serializable::BytesSerializable;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct MqttConfig {
    pub ip: Ipv4Addr,
    pub port: u16,
    pub keepalive: u16,
    pub subscribe_topic: String,
    pub username: String,
    pub password: String,
    pub client_id: String,
}

impl MqttConfig {
    pub fn new(
        ip: Ipv4Addr,
        port: u16,
        keepalive: u16,
        subscribe_topic: String,
        username: String,
        password: String,
        client_id: String,
    ) -> Self {
        Self {
            ip,
            port,
            keepalive,
            subscribe_topic,
            username,
            password,
            client_id,
        }
    }
}

impl BytesSerializable for MqttConfig {
    fn to_bytes(&self) -> Bytes {
        let subscribe_topic = self.subscribe_topic.as_bytes();
        let username = self.username.as_bytes();
        let password = self.password.as_bytes();
        let client_id = self.client_id.as_bytes();

        let mut bytes = BytesMut::new();
        bytes.put_u32(self.ip.to_bits());
        bytes.put_u16(self.port);
        bytes.put_u16(self.keepalive);
        put_u8_string(&mut bytes, subscribe_topic);
        put_u8_string(&mut bytes, username);
        put_u8_string(&mut bytes, password);
        put_u8_string(&mut bytes, client_id);
        bytes.freeze()
    }

    fn from_bytes(bytes: Bytes) -> Result<Self, crate::error::Error>
    where
        Self: Sized,
    {
        if bytes.len() < 12 {
            return Err(crate::error::Error::InvalidCommand);
        }

        let ip = u32::from_be_bytes(bytes[0..4].try_into().unwrap());
        let port = u16::from_be_bytes(bytes[4..6].try_into().unwrap());
        let keepalive = u16::from_be_bytes(bytes[6..8].try_into().unwrap());
        let mut position = 8;

        let subscribe_topic = read_u8_string(&bytes, &mut position)?;
        let username = read_u8_string(&bytes, &mut position)?;
        let password = read_u8_string(&bytes, &mut position)?;
        let client_id = read_u8_string(&bytes, &mut position)?;
        if position != bytes.len() {
            return Err(crate::error::Error::InvalidCommand);
        }

        Ok(Self {
            ip: ip.into(),
            port,
            keepalive,
            subscribe_topic,
            username,
            password,
            client_id,
        })
    }
}

fn put_u8_string(bytes: &mut BytesMut, value: &[u8]) {
    bytes.put_u8(u8::try_from(value.len()).expect("MQTT string field length must be <= 255"));
    bytes.put_slice(value);
}

fn read_u8_string(bytes: &Bytes, position: &mut usize) -> Result<String, crate::error::Error> {
    if *position >= bytes.len() {
        return Err(crate::error::Error::InvalidCommand);
    }
    let len = bytes[*position] as usize;
    *position += 1;
    if bytes.len() < *position + len {
        return Err(crate::error::Error::InvalidCommand);
    }
    let value = String::from_utf8(bytes[*position..*position + len].to_vec())?;
    *position += len;
    Ok(value)
}
