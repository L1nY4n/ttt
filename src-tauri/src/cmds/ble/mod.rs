use calc3::BeaconData;
use chrono::{Local, NaiveDateTime};
use rumqttc::{AsyncClient, MqttOptions, QoS};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{Emitter, Manager};
use tauri_plugin_store::StoreExt;
use tokio::sync::{mpsc, Mutex};

static MQTT_STORE_KEY: &str = "mqtt";

mod calc;
pub mod calc1;
pub mod calc3;
mod protocol;

#[derive(Default, Serialize, Deserialize, Clone)]
struct Light {
    pub ip: String,
    pub mac: String,
    pub addr: u16,
    pub name: String,
    pub gateway: String,
    pub date: NaiveDateTime,
    pub status: u8,
    pub mode: u8,
    pub version: u8,
    pub position: Option<Position>,
}

#[derive(Debug, Serialize, Clone)]
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

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct StateOld {
    connected: bool,
    gateway: HashMap<String, Gateway>,
    light: HashMap<u16, Light>,
}

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct State {
    connected: bool,
    #[serde(skip)]
    tx: Option<mpsc::Sender<MqttClientMsg>>,
    gateway: HashMap<String, Gateway>,
    light: HashMap<u16, Light>,
    beacon: HashMap<u32, Beacon>,
}

impl State {
    pub fn new(app_handle: tauri::AppHandle) -> Mutex<Self> {
        let s = if let Ok(store) = app_handle.store("store.json") {
            if let Some(mqtt) = store.get(MQTT_STORE_KEY) {
                let mut s: State = match serde_json::from_value(mqtt.clone()) {
                    Ok(s) => s,
                    Err(e) => {
                        println!("mqtt store err ={}", e);
                        let s_old = serde_json::from_value::<StateOld>(mqtt).unwrap();
                        let mut s = State::default();
                        s.connected = s_old.connected;
                        s.gateway = s_old.gateway;
                        s.light = s_old.light;

                        s
                    }
                };
                s.connected = false;
                s
            } else {
                let s = Default::default();
                let _ = store.set(MQTT_STORE_KEY, serde_json::json!(s));
                s
            }
        } else {
            Self::default()
        };

        Mutex::new(s)
    }
}

impl State {
    fn update_light_name(&mut self, light_addr: u16, name: String) {
        if let Some(light) = self.light.get_mut(&light_addr) {
            light.name = name;
        }
    }

    fn update_light(&mut self, light_addr: u16, name: String, position: Position) {
        if let Some(light) = self.light.get_mut(&light_addr) {
            light.name = name;
            light.position = Some(position);
        }
    }
    fn update_beacon_rssi(
        &mut self,
        beacon_id: u32,
        rssi: i8,
        battery: u8,
        light_addr: u16,
    ) -> bool {
        let light_or_none = self.light.get(&light_addr);
        let light_position = light_or_none.and_then(|light| light.position.clone());
        if let Some(beacon) = self.beacon.get_mut(&beacon_id) {
            let mut change = beacon.battery == battery;
            beacon.battery = battery;
            beacon.date = Some(Local::now().naive_local());
            if let Some(light_position) = light_position {
                change = beacon.calc_positon(light_addr, light_position, rssi) || change;
            }
            return change;
        } else {
            let mut rssi_map = HashMap::new();
            if light_position.is_some() {
                rssi_map.insert(
                    light_addr,
                    RssiItem::new(rssi, light_position.unwrap(), Local::now().naive_local()),
                );
            }
            self.beacon.insert(
                beacon_id,
                Beacon {
                    name: "".to_string(),
                    id: beacon_id,
                    battery,
                    position: None,
                    rssi_map,
                    date: Some(Local::now().naive_local()),
                },
            );
            true
        }
    }
}

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct Gateway {
    pub name: String,
    model: String,
    pub ip: String,
    pub mac: String,
    pub version: u8,
    pub date: NaiveDateTime,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Beacon {
    pub name: String,
    pub id: u32,
    pub battery: u8,
    pub position: Option<Position>,

    pub rssi_map: HashMap<u16, RssiItem>,
    date: Option<NaiveDateTime>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct RssiItem {
    pub rssi: i8,
    pub position: Position,
    pub date: NaiveDateTime,
    pub distance: f64,
}

impl RssiItem {
    pub fn new(rssi: i8, postion: Position, date: NaiveDateTime) -> Self {
        let distance = calc3::LocationCalculator::new(-55.0, 2.0).rssi_to_distance(rssi as f64);
        Self {
            rssi,
            position: postion,
            date,
            distance,
        }
    }
}

impl Beacon {
    pub fn get_rssi_map(&self) -> &HashMap<u16, RssiItem> {
        &self.rssi_map
    }

    fn calc_positon(&mut self, light_addr: u16, position: Position, rssi: i8) -> bool {
        if let Some(prev) = self.rssi_map.get_mut(&light_addr) {
            println!("prev={:#?}, curr: {}", prev.rssi, rssi);
            if prev.rssi - rssi > 4 || prev.rssi - rssi < -4 {
                let rssi = ((prev.rssi as i16 + rssi as i16) / 2) as i8;
                self.rssi_map.insert(
                    light_addr,
                    RssiItem::new(rssi, position, Local::now().naive_local()),
                );
            }
        } else {
            self.rssi_map.insert(
                light_addr,
                RssiItem::new(rssi, position, Local::now().naive_local()),
            );
        }

        self.rssi_map = self
            .rssi_map
            .iter()
            .filter(|(_, item)| {
                let diff = Local::now().naive_local() - item.date;
                diff.num_seconds() <= 16
            })
            .map(|(k, v)| (*k, v.clone()))
            .collect();

        if self.rssi_map.len() < 3 {
            return false;
        }

        let mut beacons = HashMap::new();
        let mut rssi_vec: Vec<_> = self.rssi_map.iter().collect();
        rssi_vec.sort_by(|a, b| b.1.rssi.cmp(&a.1.rssi));
        for (
            addr,
            RssiItem {
                position: postion,
                rssi,
                date,
                ..
            },
        ) in &rssi_vec[..std::cmp::min(rssi_vec.len(), 4)]
        {
            beacons.insert(
                addr.to_string(),
                BeaconData {
                    position: nalgebra::Vector3::new(postion.x, postion.y, postion.z),
                    rssi: *rssi as f64,
                },
            );
        }

        if beacons.len() < 4 {
            println!("beacons len < 4");
            return false;
        }

        let pos = calc3::LocationCalculator::new(-55.0, 2.0).calculate_position_2d(&beacons);
        if let Some(pos) = pos {
            println!("calc_positon={:#?}", pos);

            if let Some(prev) = self.position.as_ref() {
                let distance = pos.metric_distance(&nalgebra::Vector3::new(prev.x, prev.y, prev.z));
                //  平滑位置变化

                match distance {
                    d if d < 0.5 => {
                        self.position = Some(Position {
                            x: pos.x,
                            y: pos.y,
                            z: pos.z,
                        });
                        true
                    }
                    // d if d > 2.0 => {
                    //     println!("distance > 3.0");
                    //     self.position = None;
                    //     false
                    // }
                    _ => {
                        self.position = Some(Position {
                            x: (pos.x + prev.x) / 2.0,
                            y: (pos.y + prev.y) / 2.0,
                            z: (pos.z + prev.z) / 2.0,
                        });
                        true
                    }
                }
            } else {
                self.position = Some(Position {
                    x: pos.x,
                    y: pos.y,
                    z: pos.z,
                });
                true
            }
        } else {
            println!("calc_positon failed");
            false
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Position {
    x: f64,
    y: f64,
    z: f64,
}

async fn process_message(app_handle: tauri::AppHandle, data: MqttRecvData) {
    // let _ = app_handle.emit("mqtt_msg", data.clone());
    let s = app_handle.state::<Mutex<State>>();
    let mut s = s.lock().await;
    match data.topic.split("/").collect::<Vec<&str>>().as_slice() { 
        ["", "application", "GW-BM-TCP", "device", gw_id, "up", "gen",_light_id] => {
            match serde_json::from_str(&data.payload) {
                Ok(msg) => match protocol::handle_gen_message(msg) {
                    Ok(packet) => match packet {
                        protocol::Packet::GatewayHeatbeat {
                            model,
                            id,
                            ip,
                            version,
                        } => {
                            if let Some(gateway) = s.gateway.get_mut(&id) {
                                gateway.name = model;
                                gateway.mac = id;
                                gateway.ip = ip;
                                gateway.version = version;
                                gateway.date = Local::now().naive_local();
                            } else {
                                let gateway = Gateway {
                                    name: model.clone(),
                                    model,
                                    version,
                                    mac: id.clone(),
                                    ip,
                                    date: Local::now().naive_local(),
                                    ..Default::default()
                                };
                                s.gateway.insert(id, gateway);
                            }
                        }
                        protocol::Packet::LightHeartbeat {
                            light_addr,
                            status,
                            mode,
                            version,
                        } => {
                            if let Some(light) = s.light.get_mut(&light_addr) {
                                light.status = status;
                                light.mode = mode;
                                light.version = version;
                                light.date = Local::now().naive_local();
                                let _ = app_handle.emit("light_update", light.clone());
                            } else {
                                let light = Light {
                                    name: "".to_string(),
                                    addr: light_addr,
                                    gateway: gw_id.to_string(),
                                    status,
                                    mode,
                                    version,
                                    date: Local::now().naive_local(),
                                    ..Default::default()
                                };
                                let _ = app_handle.emit("light_update", light.clone());
                                s.light.insert(light_addr, light);
                            }
                        }
                        protocol::Packet::LightBeacon {
                            light_addr,
                            beacons,
                        } => beacons.iter().for_each(|(id, rssi, battery)| {
                            if s.update_beacon_rssi(*id, *rssi, *battery, light_addr) {
                                let _ = app_handle.emit("beacon_update", s.beacon.get(id));
                            }
                        }),
                    },
                    Err(err) => {
                        println!("handle_message err ={}", err);
                    }
                },
                Err(err) => {
                    println!("process_message {} --- err ={}", data.payload, err);
                }
            }
        }
        ["", "application", "GW-BM-TCP", "device", _gw_id, "up", "ibeacon",_light_id]  =>{
            match serde_json::from_str(&data.payload) {
                Ok(msg) => match protocol::handle_gen_message(msg) {
                    Ok(packet) => match packet {
         
                        protocol::Packet::LightBeacon {
                            light_addr,
                            beacons,
                        } => beacons.iter().for_each(|(id, rssi, battery)| {
                            if s.update_beacon_rssi(*id, *rssi, *battery, light_addr) {
                                let _ = app_handle.emit("beacon_update", s.beacon.get(id));
                            }
                        }),
                        _ =>{

                        }
                    },
                    Err(err) => {
                        println!("handle_message err ={}", err);
                    }
                },
                Err(err) => {
                    println!("process_message {} --- err ={}", data.payload, err);
                }
            }

        }
        _ => {
            println!("process_message topic ={}", data.topic);
        }
    }
}

#[tauri::command]
pub async fn mqtt_create_client(
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
    let (client, mut eventloop) = AsyncClient::new(mqttoptions, 10);
    client.subscribe("#", QoS::AtMostOnce).await.unwrap();
    client.subscribe("/#", QoS::AtMostOnce).await.unwrap();
    println!("{:#?}", client);
    let (manager_tx, mut manager_rx) = mpsc::channel::<MqttClientMsg>(1);
    let app_clone = app.clone();
    let state = app.state::<Mutex<State>>();

    let mut s = state.lock().await;
    s.connected = true;
    s.tx = Some(manager_tx);

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
                            println!("close ");
                                let _ = client.disconnect().await;
                                let   s =  app_clone.state::<Mutex<State>>();
                                let mut  s = s.lock().await;
                                s.connected = false;
                                break;
                          },
                      }
                 }
                recv_res = eventloop.poll() => {
                             if let Ok(event) = recv_res{

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

                                                        process_message(app_clone.clone(), d).await ;



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
                                                    rumqttc::Packet::Disconnect => {
                                                        println!("disconnect");
                                                        let s = app_clone.state::<Mutex<State>>();
                                                        let mut s = s.lock().await;
                                                        s.connected = false;
                                                    },
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

        let s = app_clone.state::<Mutex<State>>();
        let mut s = s.lock().await;
        s.connected = false;
    });

    Ok(())
}

#[tauri::command]
pub async fn mqtt_close_client(state: tauri::State<'_, Mutex<State>>) -> Result<(), String> {
    let state = state.lock().await;
    match state.tx.as_ref() {
        Some(sender) => sender
            .send(MqttClientMsg::Close)
            .await
            .map_err(|e| e.to_string()),
        None => Ok(()),
    }
}

#[tauri::command]
pub async fn mqtt_publish(
    topic: String,
    playload: String,
    qos: u8,
    retain: bool,
    state: tauri::State<'_, Mutex<State>>,
) -> Result<(), String> {
    let qos_ = rumqttc::qos(qos).unwrap_or(QoS::AtMostOnce);
    let data = MqttPublishData {
        topic: topic,
        qos: qos_,
        retain: retain,
        playload: playload,
    };
    let state = state.lock().await;
    match state.tx.as_ref() {
        Some(sender) => sender
            .send(MqttClientMsg::SendData(data))
            .await
            .map_err(|e| e.to_string()),
        None => Ok(()),
    }
}

#[tauri::command]
pub async fn mqtt_state(
    state: tauri::State<'_, Mutex<State>>,
    app: tauri::AppHandle,
) -> Result<State, crate::error::Error> {
    let s = state.lock().await.clone();

    Ok(s)
}

#[tauri::command]
pub async fn update_light(
    addr: u16,
    position: Position,
    name: String,
    state: tauri::State<'_, Mutex<State>>,
    app: tauri::AppHandle,
) -> Result<(), crate::error::Error> {
    let mut s = state.lock().await;
    s.update_light(addr, name, position);
    let store = app.store("store.json")?;
    if let Some(mqtt) = store.get("mqtt") {
        let _ = store.set("mqtt", serde_json::json!(*s));
    }
    Ok(())
}
