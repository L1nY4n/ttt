use std::net::Ipv4Addr;

use bytes::{BufMut, BytesMut};
use serde::{Deserialize, Serialize};

use crate::protocol::bytes_serializable::BytesSerializable;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Network {
    pub dhcp: u8,
    pub ipaddr: Ipv4Addr,
    pub gateway: Ipv4Addr,
    pub netmask: Ipv4Addr,
    pub dns: Ipv4Addr,
}

impl Network {
    pub fn new(dhcp: u8, ip: Ipv4Addr, gateway: Ipv4Addr, mask: Ipv4Addr, dns: Ipv4Addr) -> Self {
        Network {
            dhcp,
            ipaddr: ip,
            gateway,
            netmask: mask,
            dns,
        }
    }
}

impl Default for Network {
    fn default() -> Self {
        Network {
            dhcp: 0,
            ipaddr: Ipv4Addr::new(0, 0, 0, 0),
            gateway: Ipv4Addr::new(0, 0, 0, 0),
            netmask: Ipv4Addr::new(0, 0, 0, 0),
            dns: Ipv4Addr::new(0, 0, 0, 0),
        }
    }
}

impl BytesSerializable for Network {
    fn to_bytes(&self) -> bytes::Bytes {
        let mut bytes = BytesMut::new();
        bytes.put_u8(self.dhcp);
        bytes.put_u32(self.ipaddr.to_bits());
        bytes.put_u32(self.gateway.to_bits());
        bytes.put_u32(self.netmask.to_bits());
        bytes.put_u32(self.dns.to_bits());
        bytes.freeze()
    }

    fn from_bytes(bytes: bytes::Bytes) -> Result<Self, crate::error::Error>
    where
        Self: Sized,
    {
        if bytes.len() < 17 {
            return Err(crate::error::Error::InvalidCommand);
        }
        let dhcp = bytes[0];
        let ip = u32::from_be_bytes(bytes[1..5].try_into().unwrap());
        let gw = u32::from_be_bytes(bytes[5..9].try_into().unwrap());
        let mask = u32::from_be_bytes(bytes[9..13].try_into().unwrap());
        let dns = u32::from_be_bytes(bytes[13..17].try_into().unwrap());

        Ok(Network {
            dhcp,
            ipaddr: ip.into(),
            gateway: gw.into(),
            netmask: mask.into(),
            dns: dns.into(),
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IpWithPort {
    pub ip: Ipv4Addr,
    port: u16,
}

impl IpWithPort {
    pub fn new(ip: Ipv4Addr, port: u16) -> Self {
        IpWithPort { ip, port }
    }
}

impl BytesSerializable for IpWithPort {
    fn to_bytes(&self) -> bytes::Bytes {
        let mut bytes = BytesMut::with_capacity(6);
        bytes.put_u32(self.ip.to_bits());
        bytes.put_u16(self.port);
        bytes.freeze()
    }

    fn from_bytes(bytes: bytes::Bytes) -> Result<Self, crate::error::Error>
    where
        Self: Sized,
    {
        if bytes.len() < 6 {
            return Err(crate::error::Error::InvalidCommand);
        }
        let ip = u32::from_be_bytes(bytes[0..4].try_into().unwrap());
        let port = u16::from_be_bytes(bytes[4..6].try_into().unwrap());
        Ok(IpWithPort {
            ip: ip.into(),
            port,
        })
    }
}
