use std::{fmt::Display, net::Ipv4Addr};

use bytes::{BufMut, Bytes, BytesMut};
use serde::{Deserialize, Serialize};

use crate::protocol::{bytes_serializable::BytesSerializable, Command};

#[derive(Default, Debug, Serialize, Deserialize)]
pub struct Scan {}

impl Command for Scan {
    fn code(&self) -> u16 {
        0x0000u16
    }
}

impl Display for Scan {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "BroadcastScan")
    }
}

impl BytesSerializable for Scan {
    fn to_bytes(&self) -> bytes::Bytes {
        Bytes::new()
    }

    fn from_bytes(_bytes: bytes::Bytes) -> Result<Self, crate::error::Error>
    where
        Self: Sized,
    {
        Ok(Scan {})
    }
}
