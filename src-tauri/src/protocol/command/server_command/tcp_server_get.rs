use std::fmt::Display;

use bytes::Bytes;
use serde::{Deserialize, Serialize};

use crate::protocol::{bytes_serializable::BytesSerializable, command::TCP_SERVER_GET, Command};

#[derive(Default, Debug, Serialize, Deserialize)]
pub struct TcpServerGet {}

impl Command for TcpServerGet {
    fn code(&self) -> u16 {
        TCP_SERVER_GET
    }
}

impl Display for TcpServerGet {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "TcpServerGet")
    }
}

impl BytesSerializable for TcpServerGet {
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
