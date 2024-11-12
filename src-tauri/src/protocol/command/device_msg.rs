use std::net::Ipv4Addr;

use bytes::{BufMut, BytesMut};

use crate::protocol::bytes_serializable::BytesSerializable;


pub struct DeviceInfo {
    pub ip: Ipv4Addr,
    pub gateway: Ipv4Addr,
    pub mask: Ipv4Addr,
}

impl BytesSerializable for DeviceInfo {
    fn to_bytes(&self) -> bytes::Bytes {
        let mut bytes = BytesMut::new();
        bytes.put_u32(self.ip.to_bits());
        bytes.put_u32(self.gateway.to_bits());
        bytes.put_u32(self.mask.to_bits());
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
            ip: ip.into(),
            gateway: gw.into(),
            mask: mask.into(),
        })
    }
}
