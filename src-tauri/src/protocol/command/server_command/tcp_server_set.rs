use std::{fmt::Display, net::Ipv4Addr};

use bytes::{BufMut, Bytes, BytesMut};
use serde::{Deserialize, Serialize};


use crate::protocol::{
    bytes_serializable::BytesSerializable,
    command::{base::{network::IpWithPort, Network}, TCP_SERVER_SET},
    Command,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct TcpServerSet {
   pub  ip_and_port: IpWithPort,
}

impl Command for TcpServerSet {
    fn code(&self) -> u16 {
        TCP_SERVER_SET
    }
}

impl Display for TcpServerSet {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "TcpServerSet")
    }
}

impl BytesSerializable for TcpServerSet {
    fn to_bytes(&self) -> bytes::Bytes {
         self.ip_and_port.to_bytes()
    }

    fn from_bytes(bytes: bytes::Bytes) -> Result<Self, crate::error::Error>
    where
        Self: Sized,
    {
        if bytes.len() < 6 {
            return Err(crate::error::Error::InvalidCommand);
        }
   
        Ok(TcpServerSet {
            ip_and_port: IpWithPort::from_bytes(bytes)?
        })
    }
}
