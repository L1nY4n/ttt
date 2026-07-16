use bytes::{BufMut, BytesMut};
use serde::{Deserialize, Serialize};

use crate::protocol::{bytes_serializable::BytesSerializable, command::base::Network};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct DeviceInfo {
    pub network: Network,
    pub extra: Vec<u8>,
}

impl BytesSerializable for DeviceInfo {
    fn to_bytes(&self) -> bytes::Bytes {
        let mut bytes = BytesMut::new();
        bytes.put_slice(&self.network.to_bytes());
        bytes.put_slice(&self.extra);
        bytes.freeze()
    }

    fn from_bytes(bytes: bytes::Bytes) -> Result<Self, crate::error::Error>
    where
        Self: Sized,
    {
        if bytes.len() < 17 {
            return Err(crate::error::Error::InvalidCommand);
        }
        let network = Network::from_bytes(bytes.slice(0..17))?;
        let extra = if bytes.len() > 17 {
            bytes[17..].to_vec()
        } else {
            Vec::new()
        };
        Ok(DeviceInfo { network, extra })
    }
}
