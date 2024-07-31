
use std::{time::Duration};

use chrono::{Local, NaiveDateTime};
use serde::Serialize;
use serialport::{DataBits, Parity, SerialPort, StopBits};
use tauri::Manager;
use tokio::sync::{mpsc, Mutex};



#[derive(Serialize,Clone)]
pub struct  SerialPortInfo {
  #[serde(rename(serialize = "portName"))]
    port_name: String,
    #[serde(rename(serialize = "portType"))]
    port_type: String
}

#[derive(Debug,Clone)]
pub enum  SerialportMsg {
  Close,
  Input(String)
  
}

#[derive(Debug,Serialize,Clone)]
pub struct  SerialPortRecvMsg{
  pub content: String,
  pub date: NaiveDateTime,
}

pub struct  State {
  current_port: Mutex<Option<Box<dyn SerialPort>>>,
  tx: Mutex<Option<mpsc::Sender<SerialportMsg>>>,

}
impl  State {
   pub fn  new() -> Self {
    State{
      current_port: Mutex::new(None),
      tx: Mutex::new(None),
    }
   }
}


#[tauri::command]
pub fn available_ports() ->Vec<SerialPortInfo>{
       let list  = serialport::available_ports().expect("get serialport error");
     let ports =   list.iter().map(|s|{
        let t = match s.port_type {
            serialport::SerialPortType::UsbPort(_) => "USB",
            serialport::SerialPortType::PciPort => "PCI",
            serialport::SerialPortType::BluetoothPort => "Bluetooth",
            serialport::SerialPortType::Unknown =>"Unknown",
            
        }.to_owned();
        SerialPortInfo{
            port_name:s.port_name.clone(),
            port_type: t
            }
        }
        ).collect();
        ports
    }


#[tauri::command]
pub async fn open_port(port_name: String,baud_rate: u32, data_bits: DataBits, stop_bits: StopBits, parity:  Parity,app: tauri::AppHandle,) -> Result<(),crate::error::Error> {

  let  port_name_copy = port_name.clone();

  let mut port = serialport::new(port_name, baud_rate)
  .timeout(Duration::from_millis(10))
  .open()?;

port.set_baud_rate(baud_rate).unwrap();
port.set_data_bits(data_bits).unwrap();
port.set_stop_bits(stop_bits).unwrap();
port.set_parity(parity).unwrap();
port.read_data_set_ready().unwrap();

let state = app.state::<State>();
 // let mut  cp = state.current_port.lock().unwrap();
 //*cp = Some(port);

 let (manager_tx, mut manager_rx) = mpsc::channel::<SerialportMsg>(1);
 let mut mtx =state.tx.lock().await;
 *mtx = Some(manager_tx);


 let app_clone = app.clone();

 tauri::async_runtime::spawn(async move {
  let mut buf: Vec<u8> = vec![0; 1024];
  loop {
    if let Ok(v) = manager_rx.try_recv(){

        match v {
            SerialportMsg::Close => {
              println!("serialport close {}",port_name_copy);
              break;
            },
            SerialportMsg::Input(msg) =>{
              println!("serialport send {:#}",msg);
              port.write("buf".as_bytes()).unwrap();
            }
        }

        
    }
    match port.read(buf.as_mut_slice()) {
    Ok(count) =>    {
      if let Ok(parsed) = core::str::from_utf8(&buf[..count]){
        let  payload = SerialPortRecvMsg{
          content: parsed.to_owned(),
       date:  Local::now().naive_local(),
        };

        let  _ =  app_clone.emit("seialport_recv", payload);
      }
  },
    Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => (),
    Err(e) => {
          println!("error: {}",e.to_string());
          break;
    },
    }
  }
 });
  


return Ok(());
}

#[tauri::command]
pub async  fn close_port(port_name: String,state: tauri::State<'_, State>) -> Result<(),crate::error::Error> {
  println!("close_port");
  let  tx =state.tx.lock().await;
  match tx.as_ref() {
    Some(sender) => 
      {
         sender
        .send(SerialportMsg::Close)
        .await
        .map_err(|e| crate::error::Error::SendError(e.to_string()))
      },
    None => Err(crate::error::Error::Unknown),
}


}


#[tauri::command]
pub async fn write_port(port_name: String, msg: String ,app: tauri::AppHandle) -> Result<(),crate::error::Error> {
  println!("send {}",msg);
  let state = app.state::<State>();
  let tx = state.tx.lock().await;
  match tx.as_ref() {
    Some(sender) => 
      {
        sender
        .send(SerialportMsg::Input(msg))
        .await
        .map_err(|e| crate::error::Error::SendError(e.to_string()))

      },
      None => Err(crate::error::Error::Unknown),
}

  }



// pub fn init<R: Runtime>() -> TauriPlugin<R> {
//     Builder::new("serialport")
//       .invoke_handler(tauri::generate_handler![
//         available_ports
//       ])
//       .setup(move |app,_| {
//         app.manage(State::new());
//         Ok(())
//       })
//       .build()
//   }