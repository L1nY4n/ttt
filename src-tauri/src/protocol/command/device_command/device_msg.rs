
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
        if bytes.len() < 12 {
            return Err(crate::error::Error::InvalidCommand);
        }

        let ip = u32::from_be_bytes(bytes[..4].try_into().unwrap());
        let gw = u32::from_be_bytes(bytes[4..8].try_into().unwrap());
        let mask = u32::from_be_bytes(bytes[8..12].try_into().unwrap());

        Ok(DeviceInfo {
            network: Network {  
                ipaddr: ip.into(),
                gateway: gw.into(),
                netmask: mask.into(),
            },
        })
    }
}
