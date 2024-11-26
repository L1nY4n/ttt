use std::{fmt::Display, net::Ipv4Addr};

use bytes::{BufMut, Bytes, BytesMut};
use serde::{Deserialize, Serialize};

use crate::protocol::{
    bytes_serializable::BytesSerializable,
    command::REBOOT,
    Command,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct Reboot {}

impl Command for Reboot {
    fn code(&self) -> u16 {
        REBOOT
    }
}

impl Display for Reboot {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Reboot")
    }
}

impl BytesSerializable for Reboot {
    fn to_bytes(&self) -> bytes::Bytes {
        Bytes::new()
    }

    fn from_bytes(bytes: bytes::Bytes) -> Result<Self, crate::error::Error>
    where
        Self: Sized,
    {
        if bytes.len() == 0 {
            Ok(Reboot {})
        } else {
            Err(crate::error::Error::InvalidCommand)
        }
    }
}
