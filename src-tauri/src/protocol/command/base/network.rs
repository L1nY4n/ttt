use std::net::Ipv4Addr;

use bytes::{BufMut, BytesMut};
use serde::{Deserialize, Serialize};

use crate::protocol::bytes_serializable::BytesSerializable;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Network {
    pub ipaddr: Ipv4Addr,
    pub gateway: Ipv4Addr,
    pub netmask: Ipv4Addr,
}

impl Network {
    pub fn new(ip: Ipv4Addr, gateway: Ipv4Addr, mask: Ipv4Addr) -> Self {
        Network { ipaddr: ip, gateway, netmask: mask }
    }
}

impl Default for Network {
    fn default() -> Self {
        Network {
            ipaddr: Ipv4Addr::new(0, 0, 0, 0),
            gateway: Ipv4Addr::new(0, 0, 0, 0),
            netmask: Ipv4Addr::new(0, 0, 0, 0),
        }
    }
}

impl BytesSerializable for Network {
    fn to_bytes(&self) -> bytes::Bytes {
        let mut bytes = BytesMut::new();
        bytes.put_u32(self.ipaddr.to_bits());
        bytes.put_u32(self.gateway.to_bits());
        bytes.put_u32(self.netmask.to_bits());
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

        Ok(Network {
            ipaddr: ip.into(),
            gateway: gw.into(),
            netmask: mask.into(),
        })
    }
}
