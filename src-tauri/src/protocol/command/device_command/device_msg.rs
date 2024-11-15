use bytes::{BufMut, BytesMut};
use serde::{Deserialize, Serialize};

use crate::protocol::{bytes_serializable::BytesSerializable, command::base::Network};

#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub network: Network,
}

impl BytesSerializable for DeviceInfo {
    fn to_bytes(&self) -> bytes::Bytes {
        let mut bytes = BytesMut::new();
        bytes.put_slice(&self.network.to_bytes());
        bytes.freeze()
    }

    fn from_bytes(bytes: bytes::Bytes) -> Result<Self, crate::error::Error>
    where
        Self: Sized,
    {
        let network = Network::from_bytes(bytes)?;
        Ok(DeviceInfo { network })
    }
}
