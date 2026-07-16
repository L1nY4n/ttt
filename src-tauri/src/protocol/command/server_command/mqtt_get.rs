use std::fmt::Display;

use bytes::Bytes;
use serde::{Deserialize, Serialize};

use crate::protocol::{bytes_serializable::BytesSerializable, command::MQTT_GET, Command};

#[derive(Default, Debug, Serialize, Deserialize)]
pub struct MqttGet {}

impl Command for MqttGet {
    fn code(&self) -> u16 {
        MQTT_GET
    }
}

impl Display for MqttGet {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "MqttGet")
    }
}

impl BytesSerializable for MqttGet {
    fn to_bytes(&self) -> Bytes {
        Bytes::new()
    }

    fn from_bytes(bytes: Bytes) -> Result<Self, crate::error::Error>
    where
        Self: Sized,
    {
        if bytes.is_empty() {
            Ok(Self {})
        } else {
            Err(crate::error::Error::InvalidCommand)
        }
    }
}
