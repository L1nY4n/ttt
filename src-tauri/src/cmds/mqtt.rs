use rumqttc::{AsyncClient, MqttOptions, QoS};


use chrono::{Local, NaiveDateTime};

use serde::{Deserialize, Serialize};
use tauri::{Emitter, Manager};
use tokio::sync::{mpsc, Mutex};

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

#[derive(Serialize, Clone)]
pub struct MqttRecvData {
    pub dup: bool,
    // pub qos: QoS,
    pub retain: bool,
    pub topic: String,
    pub pkid: u16,
    pub payload: String,
    pub date: NaiveDateTime,
}

struct MqttPublishData {
    pub topic: String,
    pub qos: QoS,
    pub retain: bool,
    pub playload: String,
}

enum MqttClientMsg {
    SendData(MqttPublishData),
    Close,
}

pub struct State {
    tx: Mutex<Option<mpsc::Sender<MqttClientMsg>>>,
}
impl State {
    pub fn new() -> Self {
        State {
            tx: Mutex::new(None),
        }
    }
}

#[tauri::command]
pub async fn create_mqtt_client(
    client_id: String,
    addr: String,
    port: u16,
    username: String,
    password: String,
    topic: String,
    app: tauri::AppHandle,
) -> Result<(), crate::error::Error> {
    println!("{}:{} {} {} ", addr, port, username, password);
    let mut mqttoptions = MqttOptions::new(client_id, addr, port);
    mqttoptions.set_keep_alive(std::time::Duration::from_secs(30));
    mqttoptions.set_credentials(username, password);
    println!("{:#?}", mqttoptions);
    let (mut client, mut eventloop) = AsyncClient::new(mqttoptions, 10);
    client.subscribe("#", QoS::AtMostOnce).await.unwrap();
    client.subscribe("/#", QoS::AtMostOnce).await.unwrap();
    println!("{:#?}", client);
    let (manager_tx, mut manager_rx) = mpsc::channel::<MqttClientMsg>(1);
    let app_clone = app.clone();
    let state = app.state::<State>();

    let mut mtx = state.tx.lock().await;
    *mtx = Some(manager_tx);
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::select! {
                  msg = manager_rx.recv() =>{
                     let Some(input) = msg else {
                         break;
                     };
                      match input {
                          MqttClientMsg::SendData(data) => {
                            let bytes = data.playload.into_bytes().into_boxed_slice();
                            let _ =  client.try_publish(data.topic, data.qos, data.retain, bytes);

                          },
                          MqttClientMsg::Close => {
                                let _ = client.disconnect().await;
                                break;
                          },
                      }
                 }
                recv_res = eventloop.poll() => {
                             if let Ok(event) = recv_res{
                                    println!("{:#?}",event);
                                    match event {
                                        rumqttc::Event::Incoming(packet) => {
                                                match packet {

                                                    rumqttc::Packet::Publish(p) =>{
                                                        let d = MqttRecvData{
                                                            dup: p.dup,
                                                             retain: p.retain,
                                                             topic: p.topic, pkid: p.pkid, payload:
                                                            core::str::from_utf8(&p.payload).unwrap().to_string(),
                                                              date:  Local::now().naive_local(),
                                                        };
                                                        let _ =  app_clone.emit("mqtt_msg", d);
                                                    },
                                                    // rumqttc::Packet::Connect(_) => todo!(),
                                                    // rumqttc::Packet::ConnAck(_) => {todo!()},
                                                    // rumqttc::Packet::PubAck(_) => todo!(),
                                                    // rumqttc::Packet::PubRec(_) => todo!(),
                                                    // rumqttc::Packet::PubRel(_) => todo!(),
                                                    // rumqttc::Packet::PubComp(_) => todo!(),
                                                    // rumqttc::Packet::Subscribe(_) => todo!(),
                                                    // rumqttc::Packet::SubAck(_) => todo!(),
                                                    // rumqttc::Packet::Unsubscribe(_) => todo!(),
                                                    // rumqttc::Packet::UnsubAck(_) => todo!(),
                                                    // rumqttc::Packet::PingReq => todo!(),
                                                    // rumqttc::Packet::PingResp => todo!(),
                                                    // rumqttc::Packet::Disconnect => todo!(),
                                                    _ =>{
                                                        println!("income {:#?}",packet);
                                                    }
                                                }
                                        },
                                        rumqttc::Event::Outgoing(outgoing) =>{
                                            println!("Outgoing: {:#?}",outgoing);
                                        },
                                    }

                             }

            }}
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn close_mqtt_client(state: tauri::State<'_, State>) -> Result<(), String> {
    let tx = state.tx.lock().await;
    match tx.as_ref() {
        Some(sender) => sender
            .send(MqttClientMsg::Close)
            .await
            .map_err(|e| e.to_string()),
        None => Ok(()),
    }
}
