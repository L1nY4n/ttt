use std::{
    collections::HashMap,
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
            base::{network::IpWithPort, MqttConfig, Network},
            server_command::{
                mqtt_get::MqttGet, mqtt_set::MqttSet, network_get::NetworkGet,
                network_set::NetworkSet, reboot::Reboot, tcp_server_get::TcpServerGet,
                tcp_server_set::TcpServerSet,
            },
            DeviceCommand, Scan, ServerCommand,
        },
        next_msg_id, Command, Packet, PacketCommand,
    },
    SystmEvent,
};

const ALL_DEVICE_IDS: u64 = u64::MAX;
const UDP_RECV_BUF_LEN: usize = 4096;

#[derive(Default, Serialize, Deserialize, Clone)]
struct Device {
    pub ip: String,
    pub mac: u64,
    #[serde(rename = "type")]
    pub ty: u8,
    pub name: String,
    pub network: Network,
    pub tcp_server: Option<IpWithPort>,
    pub mqtt_config: Option<MqttConfig>,
    pub text: String,
    pub labels: Vec<String>,
    pub status: u8,
    pub date: NaiveDateTime,
}

#[derive(Serialize, Deserialize, Clone)]
struct CommandAck {
    pub ip: String,
    pub mac: u64,
    pub command: u16,
    pub status: u8,
    pub msg_id: u64,
    pub date: NaiveDateTime,
}

enum BroadcastMsg {
    SendData {
        packet: Packet,
        target_ip: Option<Ipv4Addr>,
    },
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
    Ok(tx.is_some())
}

#[tauri::command]
pub async fn create_broadcast(
    ip: String,
    port: u16,
    app: tauri::AppHandle,
) -> Result<(), crate::error::Error> {
    println!("{}:{}", ip, port);
    use socket2::{Domain, Protocol, Socket, Type};

    let multicast_addr =
        Ipv4Addr::from_str(&ip).map_err(|_| crate::error::Error::InvalidCommand)?;

    let socket = Socket::new(Domain::IPV4, Type::DGRAM, Some(Protocol::UDP))?;
    socket.set_reuse_address(false)?;
    socket.set_nonblocking(true)?;
    socket.join_multicast_v4(&multicast_addr, &Ipv4Addr::UNSPECIFIED)?;
    socket.bind(&SocketAddrV4::new(Ipv4Addr::UNSPECIFIED, port).into())?;
    let (manager_tx, mut manager_rx) = mpsc::channel::<BroadcastMsg>(8);
    let app_clone = app.clone();
    let state = app.state::<BroadcastState>();
    let _interfaces = state.network_interfaces.clone();

    let mut mtx = state.tx.lock().await;
    *mtx = Some(manager_tx);
    let mut buf = [0; UDP_RECV_BUF_LEN];
    tauri::async_runtime::spawn(async move {
        let udp = tokio::net::UdpSocket::from_std(socket.into()).unwrap();
        let mut devices: HashMap<u64, Device> = HashMap::new();

        loop {
            tokio::select! {
              msg = manager_rx.recv() =>{
                 let Some(input) = msg else {
                     break;
                 };
                  match input {
                      BroadcastMsg::SendData { packet, target_ip } => {
                        let bytes = packet.as_bytes();
                        let target = SocketAddrV4::new(target_ip.unwrap_or(multicast_addr), port);
                        println!("send {} {:02X}", target, bytes);
                        let _ = udp.send_to(&bytes, target).await.expect("cannot send message to socket");
                      },

                      BroadcastMsg::Cancel => {
                            break;
                      },
                  }
             }
            recv_res = udp.recv_from(&mut buf) => {
                                 let (count, remote_addr) = recv_res.expect("cannot receive from socket");
                                 let remote_ip = remote_addr.ip();

                                let data  = Bytes::copy_from_slice(&buf[..count]);
                                println!("recv {}, {:02X}",remote_ip,data);
                              match Packet::from_bytes(data) {
                                  Ok(pkt) =>{
                                    println!("recv pkt  {:#?}",pkt);
                                    match &pkt.command{
                                   PacketCommand::ServerCommand(server_command) =>{
                                        if let ServerCommand::Scan(_scan) = server_command {
                                            println!("recv scan request from {}", remote_ip);
                                        }
                                        },
                                   PacketCommand::DeviceCommand(device_command) =>{
                                            handle_device_command(
                                                &app_clone,
                                                &mut devices,
                                                &pkt,
                                                remote_ip,
                                                device_command,
                                            );
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
    send_packet(
        state,
        Packet::new_server_cmd(
            0,
            ALL_DEVICE_IDS,
            next_msg_id(),
            ServerCommand::Scan(Scan::default()),
        ),
        None,
    )
    .await
    .map(|_| ())
}

#[tauri::command]
pub async fn network_get(
    mac: u64,
    target_ip: Option<String>,
    state: tauri::State<'_, BroadcastState>,
) -> Result<bool, String> {
    send_packet(
        state,
        Packet::new_server_cmd(
            0,
            mac,
            next_msg_id(),
            ServerCommand::NetworkGet(NetworkGet::default()),
        ),
        target_ip,
    )
    .await
}

#[tauri::command]
pub async fn network_set(
    mac: u64,
    target_ip: Option<String>,
    network: Network,
    state: tauri::State<'_, BroadcastState>,
) -> Result<bool, String> {
    send_packet(
        state,
        Packet::new_server_cmd(
            0,
            mac,
            next_msg_id(),
            ServerCommand::NetworkSet(NetworkSet { network }),
        ),
        target_ip,
    )
    .await
}

#[tauri::command]
pub async fn tcp_server_get(
    mac: u64,
    target_ip: Option<String>,
    state: tauri::State<'_, BroadcastState>,
) -> Result<bool, String> {
    send_packet(
        state,
        Packet::new_server_cmd(
            0,
            mac,
            next_msg_id(),
            ServerCommand::TcpServerGet(TcpServerGet::default()),
        ),
        target_ip,
    )
    .await
}

#[tauri::command]
pub async fn tcp_server_set(
    mac: u64,
    target_ip: Option<String>,
    tcp_server: IpWithPort,
    state: tauri::State<'_, BroadcastState>,
) -> Result<bool, String> {
    send_packet(
        state,
        Packet::new_server_cmd(
            0,
            mac,
            next_msg_id(),
            ServerCommand::TcpServerSet(TcpServerSet {
                ip_and_port: tcp_server,
            }),
        ),
        target_ip,
    )
    .await
}

#[tauri::command]
pub async fn mqtt_config_get(
    mac: u64,
    target_ip: Option<String>,
    state: tauri::State<'_, BroadcastState>,
) -> Result<bool, String> {
    send_packet(
        state,
        Packet::new_server_cmd(
            0,
            mac,
            next_msg_id(),
            ServerCommand::MqttGet(MqttGet::default()),
        ),
        target_ip,
    )
    .await
}

#[tauri::command]
pub async fn mqtt_config_set(
    mac: u64,
    target_ip: Option<String>,
    mqtt_config: MqttConfig,
    state: tauri::State<'_, BroadcastState>,
) -> Result<bool, String> {
    validate_mqtt_config(&mqtt_config)?;
    send_packet(
        state,
        Packet::new_server_cmd(
            0,
            mac,
            next_msg_id(),
            ServerCommand::MqttSet(MqttSet { mqtt_config }),
        ),
        target_ip,
    )
    .await
}

#[tauri::command]
pub async fn reboot(
    mac: u64,
    target_ip: Option<String>,
    state: tauri::State<'_, BroadcastState>,
) -> Result<bool, String> {
    send_packet(
        state,
        Packet::new_server_cmd(0, mac, next_msg_id(), ServerCommand::Reboot(Reboot {})),
        target_ip,
    )
    .await
}

async fn send_packet(
    state: tauri::State<'_, BroadcastState>,
    packet: Packet,
    target_ip: Option<String>,
) -> Result<bool, String> {
    let target_ip = parse_target_ip(target_ip)?;
    let tx = state.tx.lock().await;
    match tx.as_ref() {
        Some(sender) => {
            sender
                .send(BroadcastMsg::SendData { packet, target_ip })
                .await
                .map_err(|e| e.to_string())?;
            Ok(true)
        }
        None => Ok(false),
    }
}

fn parse_target_ip(target_ip: Option<String>) -> Result<Option<Ipv4Addr>, String> {
    match target_ip.filter(|ip| !ip.trim().is_empty()) {
        Some(ip) => ip
            .parse::<Ipv4Addr>()
            .map(Some)
            .map_err(|e| format!("invalid target ip {ip}: {e}")),
        None => Ok(None),
    }
}

fn validate_mqtt_config(mqtt_config: &MqttConfig) -> Result<(), String> {
    for (name, value) in [
        ("subscribe_topic", mqtt_config.subscribe_topic.as_str()),
        ("username", mqtt_config.username.as_str()),
        ("password", mqtt_config.password.as_str()),
        ("client_id", mqtt_config.client_id.as_str()),
    ] {
        if value.as_bytes().len() > u8::MAX as usize {
            return Err(format!("{name} is longer than 255 bytes"));
        }
    }
    Ok(())
}

fn handle_device_command(
    app: &tauri::AppHandle,
    devices: &mut HashMap<u64, Device>,
    pkt: &Packet,
    remote_ip: IpAddr,
    device_command: &DeviceCommand,
) {
    match device_command {
        DeviceCommand::ScanResp(info) | DeviceCommand::NetworkGetResp(info) => {
            let dev = device_entry(devices, pkt, remote_ip);
            dev.network = info.network.clone();
            dev.ip = info.network.ipaddr.to_string();
            dev.name = dev.ip.clone();
            dev.status = pkt.status;
            dev.date = Local::now().naive_local();
            emit_device(app, dev.clone());
        }
        DeviceCommand::TcpServerGetResp(tcp_server) => {
            let dev = device_entry(devices, pkt, remote_ip);
            dev.tcp_server = Some(tcp_server.clone());
            dev.status = pkt.status;
            dev.date = Local::now().naive_local();
            emit_device(app, dev.clone());
        }
        DeviceCommand::MqttGetResp(mqtt_config) => {
            let dev = device_entry(devices, pkt, remote_ip);
            dev.mqtt_config = Some(mqtt_config.clone());
            dev.status = pkt.status;
            dev.date = Local::now().naive_local();
            emit_device(app, dev.clone());
        }
        DeviceCommand::NetworkSetResp
        | DeviceCommand::TcpServerSetResp
        | DeviceCommand::MqttSetResp
        | DeviceCommand::RebootResp => {
            let dev = device_entry(devices, pkt, remote_ip);
            dev.status = pkt.status;
            dev.date = Local::now().naive_local();
            emit_device(app, dev.clone());
        }
    }
    emit_ack(
        app,
        CommandAck {
            ip: remote_ip.to_string(),
            mac: pkt.device_mac,
            command: device_command.code(),
            status: pkt.status,
            msg_id: pkt.msg_id,
            date: Local::now().naive_local(),
        },
    );
}

fn device_entry<'a>(
    devices: &'a mut HashMap<u64, Device>,
    pkt: &Packet,
    remote_ip: IpAddr,
) -> &'a mut Device {
    devices.entry(pkt.device_mac).or_insert_with(|| Device {
        ip: remote_ip.to_string(),
        mac: pkt.device_mac,
        ty: pkt.device_type,
        name: remote_ip.to_string(),
        text: format!("{:012X}", pkt.device_mac & 0x0000_FFFF_FFFF_FFFF),
        date: Local::now().naive_local(),
        ..Default::default()
    })
}

fn emit_device(app: &tauri::AppHandle, dev: Device) {
    let _ = app.emit("boracast_msg", dev.clone());
    let _ = app.emit("broadcast_msg", dev);
}

fn emit_ack(app: &tauri::AppHandle, ack: CommandAck) {
    let _ = app.emit("broadcast_ack", ack);
}
