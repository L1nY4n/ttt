use std::{
    net::{Ipv4Addr, SocketAddrV4},
    str::FromStr,
};

use chrono::{Local, NaiveDateTime};
use serde::{Deserialize, Serialize};
use tauri::Manager;
use tokio::sync::{mpsc, Mutex};

use crate::SystmEvent;

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
    SendData(String),
    Cancel,
}

pub struct BroadcastState {
    tx: Mutex<Option<mpsc::Sender<BroadcastMsg>>>,
}
impl BroadcastState {
    pub fn new() -> Self {
        BroadcastState {
            tx: Mutex::new(None),
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
    let mut mtx = state.tx.lock().await;
    *mtx = Some(manager_tx);

    tauri::async_runtime::spawn(async move {
        let udp = tokio::net::UdpSocket::from_std(socket.into()).unwrap();
        let mut buf = [0; 164];
        loop {
            tokio::select! {
              msg = manager_rx.recv() =>{
                 let Some(input) = msg else {
                     break;
                 };
                  match input {
                      BroadcastMsg::SendData(str) => {
                        let bytes = str.into_bytes().into_boxed_slice();

                       let  _ =  udp.send_to(&bytes, (addr, port)).await.expect("cannot send message to socket");
                      },
                      BroadcastMsg::Cancel => {
                            break;
                      },
                  }
             }
            recv_res = udp.recv_from(&mut buf) => {
                                 let (count, remote_addr) = recv_res.expect("cannot receive from socket");
                                 if let Ok(parsed) = core::str::from_utf8(&buf[..count]) {
                                     let dev = Device{
                                         ip: remote_addr.to_string(),
                                         text: parsed.to_string(),
                                         date:  Local::now().naive_local(),
                                         ..Default::default()
                                     };
                                   let _ =  app_clone.emit("boracast_msg", dev);
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
pub async fn scan(data: String, state: tauri::State<'_, BroadcastState>) -> Result<(), String> {
    let tx = state.tx.lock().await;
    match tx.as_ref() {
        Some(sender) => sender
            .send(BroadcastMsg::SendData(data))
            .await
            .map_err(|e| e.to_string()),
        None => Ok(()),
    }
}
