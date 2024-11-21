use std::{net::Ipv4Addr, time::Duration};

use bytes::{BufMut, Bytes, BytesMut};
use tokio::{net::UdpSocket, time};

use crate::error;

fn oxr8(buff: &[u8]) -> u8 {
    buff.iter().copied().reduce(|acc, b| acc ^ b).unwrap()
}

const PREFIX: u8 = 0x02;
const END: u8 = 0x03;
const TYPE: u8 = 0x11;

struct Packet {
    mac: u64,
    cmd: u16,
    body: bytes::Bytes,
    status: u8,
}

impl Packet {
    pub fn to_bytes(&self) -> bytes::Bytes {
        let status = 0xffu8;
        let length = self.body.len() + 11;
        let mac_bin = self.mac.to_be_bytes();

        let mut data = BytesMut::with_capacity(length);
        data.put_u8(PREFIX.into());
        data.put_u16(length.try_into().unwrap());
        data.put_slice(&mac_bin[2..]);

        data.put_u8(TYPE.into());
        data.put_u16(self.cmd);
        data.put_u8(status.into());
        data.put_slice(&self.body);
        let oxr = oxr8(&data);
        data.put_u8(oxr.into());
        data.put_u8(END.into());

        data.freeze()
    }
    fn from_bytes(bytes: &bytes::Bytes) -> Result<Packet, crate::error::Error> {
        match bytes.as_ref() {
            [PREFIX, body @ .., check_sum, END] if oxr8(&body) == *check_sum => match body {
                [_len_h, _len_l, _, _, _, _, _, _, _ty, cmd_h, cmd_l, status, b @ ..] => {
                    Ok(Packet {
                        mac: 0,
                        cmd: ((*cmd_h as u16) << 8) + (*cmd_l as u16),
                        status: *status,
                        body: Bytes::copy_from_slice(b),
                    })
                }
                _ => Err(error::Error::InvalidCommand),
            },
            _ => Err(error::Error::CrcError),
        }
    }
}

async fn udp_send(
    ip_str: &str,
    port: u16,
    cmd: u16,
    body: bytes::Bytes,
) -> Result<Packet, crate::error::Error> {
    let ip = ip_str.parse::<Ipv4Addr>().expect("Invalid IP address");
    // 创建UDP套接字
    let socket = UdpSocket::bind(("0.0.0.0", 39998))
        .await
        .expect("Failed to bind to address");
    socket.connect((ip, port)).await?;

    let pkt = Packet {
        mac: 0x0000FFFFFFFFFF,
        cmd,
        body,
        status: 0,
    };
    let data = pkt.to_bytes();

    socket.send(&data).await?;

    let mut buffer = [0u8; 64];
    let result = time::timeout(Duration::from_secs(2), socket.recv_from(&mut buffer))
        .await
        .map_err(|e| crate::error::Error::Timeout)?;

    match result {
        Ok((count, _src)) => Packet::from_bytes(&Bytes::copy_from_slice(&buffer[..count])),
        Err(e) => Err(crate::error::Error::Io(e)),
    }
}
