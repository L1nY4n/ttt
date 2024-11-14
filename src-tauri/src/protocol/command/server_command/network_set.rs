use std::fmt::Display;

use bytes::Bytes;
use serde::{Deserialize, Serialize};
use tokio::net;

use crate::protocol::{
    bytes_serializable::BytesSerializable,
    command::{base::Network, NETWORK_SET},
    Command,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct NetworkSet {
    pub network: Network,
}

impl Command for NetworkSet {
    fn code(&self) -> u16 {
        NETWORK_SET
    }
}

impl Display for NetworkSet {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "NetworkSet")
    }
}

impl BytesSerializable for NetworkSet {
    fn to_bytes(&self) -> bytes::Bytes {
        self.network.to_bytes()
    }

    fn from_bytes(bytes: bytes::Bytes) -> Result<Self, crate::error::Error>
    where
        Self: Sized,
    {
        let network = Network::from_bytes(bytes)?;
        Ok(NetworkSet { network })
    }
}
