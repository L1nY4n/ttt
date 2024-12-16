use std::{
    net::{IpAddr, Ipv4Addr, SocketAddrV4},
    str::FromStr,
};

use bytes::Bytes;
use chrono::{Local, NaiveDateTime};
use local_ip_address::list_afinet_netifas;
use serde::{Deserialize, Serialize};
use tauri::{Emitter, Manager};
use tokio::sync::{mpsc, Mutex};

use crate::{
    protocol::{
        command::{
            base::{network::IpWithPort, Network},
            device_command::device_msg::DeviceInfo,
            server_command::{
                network_set::NetworkSet, reboot::Reboot, tcp_server_set::TcpServerSet,
            },
            DeviceCommand, Scan, ServerCommand,
        },
        Packet, PacketCommand,
    },
    SystmEvent,
};

#[derive(Default, Serialize, Deserialize, Clone)]
struct Device {
    pub ip: String,
    pub mac: u64,
    #[serde(rename = "type")]
    pub ty: u8,
    pub name: String,
    pub network: Network,
    pub text: String,
    pub labels: Vec<String>,
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
pub async fn check_broadcast(state: tauri::State<'_, BroadcastState>) -> Result<bool, String> {
    let tx = state.tx.lock().await;
    match tx.as_ref() {
        Some(sender) => Ok(true),
        None => Ok(false),
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
                                println!("recv {}, {:02X}",remote_ip,data);
                              match     Packet::from_bytes(data) {
                                  Ok(pkt) =>{
                                    println!("recv pkt  {:#?}",pkt);
                                    match  pkt.command{
                                   PacketCommand::ServerCommand(server_command) =>{


                            //      let if_name = interfaces.iter().find_map(|(name,addr)|{
                            //         if  *addr == remote_ip {
                            //             Some(name)
                            //         }else{
                            //             None
                            //         }
                            //       });
                            //       let name = match if_name {
                            //           Some(name) => name.to_owned(),
                            //           None =>remote_ip.to_string(),
                            //       };

                            //     let dev = Device{
                            //        name: name,
                            //         ip: remote_ip.to_string(),
                            //         text: "".to_string(),
                            //         date:  Local::now().naive_local(),
                            //         ..Default::default()
                            //     };
                            //   let _ =  app_clone.emit("boracast_msg", dev);

                                        match server_command{
                                            ServerCommand::Scan(_scan) => {

                                            }
                                            _ =>{

                                            }

                                        }

                                        },
                                   PacketCommand::DeviceCommand(device_command) =>{
                                    match device_command{
                                        DeviceCommand::Info(info) => {
                                            let dev = Device{
                                                name: info.network.ipaddr.to_string(),
                                                mac: pkt.device_mac,
                                                 ip: info.network.ipaddr.to_string(),
                                                text: pkt.device_mac.to_string(),
                                                date:  Local::now().naive_local(),
                                                network: info.network,
                                                ..Default::default()
                                            };
                                            let _ =  app_clone.emit("boracast_msg", dev);
                                        }
                                    }
                                        },
                                    }
                                  },
                                  Err(err) =>{
                                    println!("{:#?}",err);
                                  },
                              }
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
            let info = DeviceInfo {
                network: Network::new(
                    0,
                    "192.168.0.4".parse().unwrap(),
                    "192.168.0.1".parse().unwrap(),
                    "255.255.255.0".parse().unwrap(),
                    "8.8.8.8".parse().unwrap(),
                ),
            };

            let pkt = Packet::new_device_cmd(6, 0x00004436333A7700, 0, DeviceCommand::Info(info));
            sender
                .send(BroadcastMsg::SendData(pkt))
                .await
                .map_err(|e| e.to_string())?;

            let pkt = Packet::new_server_cmd(0, 0, 0, ServerCommand::Scan(Scan::default()));
            sender
                .send(BroadcastMsg::SendData(pkt))
                .await
                .map_err(|e| e.to_string())
        }
        None => Ok(()),
    }
}

#[tauri::command]
pub async fn network_set(
    mac: u64,
    network: Network,
    state: tauri::State<'_, BroadcastState>,
) -> Result<bool, String> {
    let tx = state.tx.lock().await;
    match tx.as_ref() {
        Some(sender) => {
            let network_set = NetworkSet { network };

            let pkt = Packet::new_server_cmd(0, mac, 0, ServerCommand::NetworkSet(network_set));
            sender
                .send(BroadcastMsg::SendData(pkt))
                .await
                .map_err(|e| e.to_string())?;

            Ok(true)
        }
        None => Ok(false),
    }
}

#[tauri::command]
pub async fn tcp_server_set(
    mac: u64,
    tcp_server: IpWithPort,
    state: tauri::State<'_, BroadcastState>,
) -> Result<bool, String> {
    let tx = state.tx.lock().await;
    match tx.as_ref() {
        Some(sender) => {
            let tcp_server_set = TcpServerSet {
                ip_and_port: tcp_server,
            };

            let pkt =
                Packet::new_server_cmd(0, mac, 0, ServerCommand::TcpServerSet(tcp_server_set));
            sender
                .send(BroadcastMsg::SendData(pkt))
                .await
                .map_err(|e| e.to_string())?;

            Ok(true)
        }
        None => Ok(false),
    }
}

#[tauri::command]
pub async fn reboot(mac: u64, state: tauri::State<'_, BroadcastState>) -> Result<bool, String> {
    let tx = state.tx.lock().await;
    match tx.as_ref() {
        Some(sender) => {
            let pkt = Packet::new_server_cmd(0, mac, 0, ServerCommand::Reboot(Reboot {}));
            sender
                .send(BroadcastMsg::SendData(pkt))
                .await
                .map_err(|e| e.to_string())?;

            Ok(true)
        }
        None => Ok(false),
    }
}
