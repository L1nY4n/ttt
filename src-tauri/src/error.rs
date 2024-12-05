// A custom error type that represents all possible in our command
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),

    #[error("serialport error: {0}")]
    SerialPort(#[from] serialport::Error),
    #[error("File is not valid utf8: {0}")]
    Utf8(#[from] std::string::FromUtf8Error),
    #[error("InvalidCommand")]
    InvalidCommand,
    #[error("NotImplement")]
    NotImplement,
    #[error("CrcError")]
    CrcError,
    #[error("Timeout")]
    Timeout,
    #[error("SendError: {0}")]
    SendError(String),

    #[error("Unknown")]
    Unknown,
}

// we must also implement serde::Serialize
impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
