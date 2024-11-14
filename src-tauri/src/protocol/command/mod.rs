pub mod base;
pub mod device_command;
pub mod server_command;

pub const SCAN: u16 = 0x0000u16;
pub const SCAN_RESP: u16 = SCAN + 1;

pub const NETWORK_GET: u16 = 0x0100u16;
pub const NETWORK_GET_RESP: u16 =  NETWORK_GET + 1;

pub const NETWORK_SET: u16 = 0x0102u16;
pub const NETWORK_SET_RESP: u16 =  NETWORK_SET + 1;

pub use server_command::broadcast_scan::Scan;
pub use server_command::ServerCommand;
pub use device_command::DeviceCommand;
