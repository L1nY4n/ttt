use std::fmt::Display;

use bytes::Bytes;
use serde::{Deserialize, Serialize};

use crate::protocol::{bytes_serializable::BytesSerializable, command::NETWORK_GET, Command};

#[derive(Default, Debug, Serialize, Deserialize)]
pub struct NetworkGet {}

impl Command for NetworkGet {
    fn code(&self) -> u16 {
        NETWORK_GET
    }
}

impl Display for NetworkGet {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "NetworkGet")
    }
}

impl BytesSerializable for NetworkGet {
    fn to_bytes(&self) -> Bytes {
        Bytes::new()
    }

    fn from_bytes(bytes: Bytes) -> Result<Self, crate::error::Error>
    where
        Self: Sized,
    {
        if bytes.is_empty() {
            Ok(Self {})
        } else {
            Err(crate::error::Error::InvalidCommand)
        }
    }
}
