use std::{
    io::Read,
    net::{IpAddr, Ipv4Addr, SocketAddrV4},
    str::FromStr,
};

use bytes::{Bytes, BytesMut};
use chrono::{Local, NaiveDateTime};
use local_ip_address::list_afinet_netifas;
use serde::{Deserialize, Serialize};
use tauri::{Emitter, Manager};
use tokio::sync::{mpsc, Mutex};

use crate::{
    protocol::{
        command::{broadcast_scan::Scan, ServerCommand},
        Packet, PacketCommand,
    },
    SystmEvent,
};

#[derive(Default, Serialize, Deserialize, Clone)]
struct Device {
    pub ip: String,
    pub mac: String,
    pub name: String,
    pub text: String,
    pub labels: Vec<String>,
    pub subject: String,
    pub date: NaiveDateTime,
}

enum BroadcastMsg {
    SendData(Packet),
    Cancel,
}

pub struct BroadcastState {
    tx: Mutex<Option<mpsc::Sender<BroadcastMsg>>>,
    network_interfaces: Vec<(String, IpAddr)>,
}
impl BroadcastState {
    pub fn new() -> Self {
        let network_interfaces = list_afinet_netifas().unwrap();

        BroadcastState {
            tx: Mutex::new(None),
            network_interfaces,
        }
    }
}

#[tauri::command]
pub async fn create_broadcast(
    ip: String,
    port: u16,
    app: tauri::AppHandle,
) -> Result<(), crate::error::Error> {
    println!("{}:{}", ip, port);
    use socket2::{Domain, Protocol, Socket, Type};

    let addr = Ipv4Addr::from_str(&ip).expect("ip format error");

    let socket = Socket::new(Domain::IPV4, Type::DGRAM, Some(Protocol::UDP))?;
    socket.set_reuse_address(false)?;
    socket.set_nonblocking(true)?;
    socket.join_multicast_v4(&addr, &Ipv4Addr::UNSPECIFIED)?;
    socket.bind(&SocketAddrV4::new(Ipv4Addr::UNSPECIFIED, port).into())?;
    let (manager_tx, mut manager_rx) = mpsc::channel::<BroadcastMsg>(1);
    let app_clone = app.clone();
    let state = app.state::<BroadcastState>();
    let interfaces = state.network_interfaces.clone();

    let mut mtx = state.tx.lock().await;
    *mtx = Some(manager_tx);
    let mut buf = [0; 256];
    tauri::async_runtime::spawn(async move {
        let udp = tokio::net::UdpSocket::from_std(socket.into()).unwrap();

        loop {
            tokio::select! {
              msg = manager_rx.recv() =>{
                 let Some(input) = msg else {
                     break;
                 };
                  match input {
                      BroadcastMsg::SendData(pkt) => {
                        let bytes =pkt.as_bytes();
                        println!("send {:02X}",bytes);
                       let  _ =  udp.send_to(&bytes, (addr, port)).await.expect("cannot send message to socket");
                      },
                      BroadcastMsg::Cancel => {
                            break;
                      },
                  }
             }
            recv_res = udp.recv_from(&mut buf) => {
                                 let (count, remote_addr) = recv_res.expect("cannot receive from socket");
                                 let  remote_ip =    remote_addr.ip() ;

                                let   data  = Bytes::copy_from_slice(&buf[..count]);

                              match     Packet::from_bytes(data) {
                                  Ok(pkt) =>{
                                    println!("{:#?}",pkt);
                                    match  pkt.command{
                                   PacketCommand::ServerCommand(server_command) =>{
                                        match server_command{
                                            ServerCommand::Scan(_scan) => {
                                                let if_name = interfaces.iter().find_map(|(name,addr)|{
                                                    if  *addr == remote_ip {
                                                        Some(name)
                                                    }else{
                                                        None
                                                    }
                                                  });
                                                  let name = match if_name {
                                                      Some(name) => name.to_owned(),
                                                      None =>remote_ip.to_string(),
                                                  };
                                                  let dev = Device{
                                                     name: name,
                                                      ip: remote_ip.to_string(),
                                                      text: "".to_string(),
                                                      date:  Local::now().naive_local(),
                                                      ..Default::default()
                                                  };
                                                let _ =  app_clone.emit("boracast_msg", dev);

                                            }

                                        }

                                        },
                                   PacketCommand::DeviceCommand(device_command) =>{

                                        },
                                    }


                                  },
                                  Err(err) =>{
                                    println!("{:#?}",err);
                                  },
                              }


                            //      if let Ok(parsed) = core::str::from_utf8(&buf[..count])  {
                            //    let  remote_ip =    remote_addr.ip() ;
                            //     let if_name =     interfaces.iter().find_map(|(name,addr)|{

                            //                 if  *addr == remote_ip {
                            //                     Some(name)
                            //                 }else{
                            //                     None
                            //                 }
                            //         });
                            //          let name = match if_name {
                            //              Some(name) => name.to_owned(),
                            //              None =>remote_ip.to_string(),
                            //          };
                            //          let dev = Device{
                            //             name: name,
                            //              ip: remote_ip.to_string(),
                            //              text: parsed.to_string(),
                            //              date:  Local::now().naive_local(),
                            //              ..Default::default()
                            //          };
                            //        let _ =  app_clone.emit("boracast_msg", dev);
                            //      }else{
                            //      }
                             }
                         }
        }
        let event = SystmEvent {
            title: "监听结束".to_owned(),
            description: format!("{}:{} 结束监听!!!", ip, port),
            datetime: Local::now().naive_local(),
        };
        let _ = app_clone.emit("system_msg", event);
    });

    Ok(())
}

#[tauri::command]
pub async fn cancel_broadcast(state: tauri::State<'_, BroadcastState>) -> Result<(), String> {
    let tx = state.tx.lock().await;
    match tx.as_ref() {
        Some(sender) => sender
            .send(BroadcastMsg::Cancel)
            .await
            .map_err(|e| e.to_string()),
        None => Ok(()),
    }
}

#[tauri::command]
pub async fn scan(state: tauri::State<'_, BroadcastState>) -> Result<(), String> {
    let tx = state.tx.lock().await;
    match tx.as_ref() {
        Some(sender) => {
            let pkt = Packet::new_server_cmd(0, 0, 0, ServerCommand::Scan(Scan::default()));
            sender
                .send(BroadcastMsg::SendData(pkt))
                .await
                .map_err(|e| e.to_string())
        }
        None => Ok(()),
    }
}
