use std::fmt::Display;

use serde::{Deserialize, Serialize};

use crate::protocol::{
    bytes_serializable::BytesSerializable,
    command::{base::MqttConfig, MQTT_SET},
    Command,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct MqttSet {
    pub mqtt_config: MqttConfig,
}

impl Command for MqttSet {
    fn code(&self) -> u16 {
        MQTT_SET
    }
}

impl Display for MqttSet {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "MqttSet")
    }
}

impl BytesSerializable for MqttSet {
    fn to_bytes(&self) -> bytes::Bytes {
        self.mqtt_config.to_bytes()
    }

    fn from_bytes(bytes: bytes::Bytes) -> Result<Self, crate::error::Error>
    where
        Self: Sized,
    {
        Ok(Self {
            mqtt_config: MqttConfig::from_bytes(bytes)?,
        })
    }
}
