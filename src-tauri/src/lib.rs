
use std::{

    net::{Ipv4Addr, SocketAddrV4},
};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tokio::sync::{mpsc, Mutex};



struct AsyncState {
    manager_tx: Mutex<mpsc::Sender<String>>,
}

#[derive(Serialize,Deserialize,Default,Clone)]
struct  Device {
    pub ip: String,
    pub mac: String ,
    pub name: String,
    pub text: String,
    pub labels: Vec<String>,
    pub subject: String
}


#[tauri::command]
async fn greet(name: String, state: tauri::State<'_, AsyncState>) -> Result<(), String> {
    let tx = state.manager_tx.lock().await;
    tx.send(name).await.map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (manager_tx, mut manager_rx) = mpsc::channel::<String>(1);
    tauri::Builder::default()
    .manage(AsyncState{
        manager_tx: Mutex::new(manager_tx)
    })
        .plugin(tauri_plugin_shell::init())
        .setup(|app|{

            use socket2::{Domain, Protocol, Socket, Type};
            let addr = Ipv4Addr::new(224, 1, 1, 1);
            let port = 31900;
            let socket = Socket::new(Domain::IPV4, Type::DGRAM, Some(Protocol::UDP))?;
            socket.set_reuse_address(false)?;
            socket.set_nonblocking(true)?;
            socket.join_multicast_v4(&addr, &Ipv4Addr::UNSPECIFIED)?;
            socket.bind(&SocketAddrV4::new(Ipv4Addr::UNSPECIFIED, port).into())?;
            let (to_frondend_tx, mut async_proc_output_rx) = mpsc::channel::<Device>(1);
            let handle = app.handle().clone();
            
            tauri::async_runtime::spawn(async move {
                           loop {
                               if let Some(output) = async_proc_output_rx.recv().await {
                                    let _ =  handle.emit("msg", output);
                               }
                           }
                       });

             tauri::async_runtime::spawn(async move {
                // A loop that takes output from the async process and sends it
                // to the webview via a Tauri Event

                let udp = tokio::net::UdpSocket::from_std(socket.into()).unwrap();
                let mut buf = [0; 64];
                loop {
                    tokio::select! {
                       
                         input_res = manager_rx.recv() =>{
                            let Some(input) = input_res else {
                                break;
                            };
                               println!("{}",input);
                             let bytes = input.into_bytes().into_boxed_slice();

                          let x =   udp.send_to(&bytes, (addr, port)).await.expect("cannot send message to socket");
                           println!("{:#?}",x);
                        }
                       recv_res = udp.recv_from(&mut buf) => {
                                            let (count, remote_addr) = recv_res.expect("cannot receive from socket");
                                            if let Ok(parsed) = core::str::from_utf8(&buf[..count]) {
                                                println!("recv_from {} <--- {}",remote_addr,parsed);
                                                let dev = Device{
                                                    ip: remote_addr.to_string(),
                                                    text: parsed.to_string(),
                                                    ..Default::default()
                                                };
                                                let _=  to_frondend_tx.send(dev).await;
                                            }
                                        }
                                    }
                }
            });

            Ok(())

        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
