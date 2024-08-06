export type Message = {
  opcode: number;
  mesh_dev_type?: number;
  value?: string | number;
  version?: number;
  dest_addr?: number;
  src_addr?: number;
  ota_data_index?: number;
  ota_pack_count?: number;
  ota_byte_size?: number;
  ota_total_size?: number;
  ipaddr?: string;
  netmask?: string;
  gateway?: string;
  mqtt_addr?: string;
  mqtt_port?: number;
  mqtt_username?: string;
  mqtt_password?: string;
  mqtt_subscribe_topic?: string;
  running_duration?: number;
  light_on_duration?: number;
  power?: number;
  energy_consumption?: number;
  dev_model?: string;
  dev_id?: string;
  value_array?: any[];
  array_total_size?: number;
  index_from?: number;
  index_to?: number;
  group_addr?: number;
  duration_begin?: number;
};

export enum OpType {
  GW_OTA_START = 0x040,
  GW_OTA_START_ACK = 0x041,
  GW_OTA_DATA = 0x042,
  BLE_OTA_START = 0x43,
  BLE_OTA_START_ACK = 0x044,
  BLE_OTA_DATA = 0x045,

  GW_INFO_REQ = 0x46,
  GW_INFO_ACK = 0x47,

  GW_NET_CONFIG_REQ = 0x48,
  GW_NET_CONFIG_ACK = 0x49,

  GW_MQTT_CONFIG_REQ = 0x4a,
  GW_MQTT_CONFIG_ACK = 0x4b,

  GW_REBOOT_REQ = 0x4c,
  GW_REBOOT_ACK = 0x4d,

  GW_MESH_REQ = 0x4e,
  GW_MESH_ACK = 0x4f,

  BLE_LIST_REQ = 0x50,
  BLE_LIST_ACK = 0x51,

  GW_DNS_CONFIG_REQ = 0x52,
  GW_DNS_CONFIG_ACK = 0x53,

  GW_HEATBEAT_DATA = 0x56,

  // Light

  LIGHT_SET_BRIGHTNESS = 0x01,
  //LIGHT_SET_BRIGHTNESS_ACK = 0x02,

  LIGHT_SET_ONOFF = 0x05,
  //LIGHT_SET_ONOFF_ACK = 0x06,

  LIGHT_OTA_START = 0x11,
  LIGHT_OTA_START_ACK = 0x12,

  LIGHT_INFO_REQ = 0x1c,
  LIGHT_INFO_ACK = 0x1d,

  LIGHT_SET_OFF_DELAY = 0x15,
  //LIGHT_SET_OFF_DELAY_ACK = 0x16,

  LIGHT_SET_MODE = 0x17,
  //LIGHT_SET_MODE_ACK = 0x18,

  LIGHT_SET_JOIN_ENABLE = 0x19,
  //LIGHT_JOIN_ENABLE_ACK = 0x1A,

  LIGHT_SET_HEATBEAT_INTERVAL = 0x1a,

  LIGHT_HEATBEAT_DATA = 0x1b,

  LIGHT_GROUP_REQ = 0x1e,
  LIGHT_GROUP_ACK = 0x1f,

  LIGHT_SCENE_SET = 0x20,

  LIGHT_SCENE_GET = 0x21,
  LIGHT_SCENE_ACK = 0x22,

  LIGHT_SCENE_MODIFY = 0x23,
  LIGHT_SCENE_DEL = 0x24,

  LIGHT_SCENE_QUERY = 0x25,
  LIGHT_SCENE_QUERY_ACK = 0x26,

  LIGHT_LINKAGE_STATE_SET = 0x27,

  LIGHT_ENERGY_INTERVAL = 0x0f,
  LIGHT_ENERGY_GET = 0x28,
  LIGHT_ENERGY_ACK = 0x29,

  LIGHT_LINKAGE_GROUP_STATE_SET = 0x30,
  LIGHT_LINKAGE_GROUP_STATE_GET = 0x31,
  LIGHT_LINKAGE_GROUP_STATE_ACK = 0x32,

  LIGHT_GROUP_SET = 0x33,

  LIGHT_LINKAGE_MODE_SET = 0x34,
}

export function handleMessage(msg: Message) {
  console.log(msg);
  let belongGw = false;
  let data = {} as object;
  switch (msg.opcode) {
    case OpType.GW_HEATBEAT_DATA:
      // {opcode: 86, version: "17", dev_model: "Turbo GW-BM-TCP-1", dev_id: "02000016CB0A", ipaddr: "192.168.100.162"}
      data = msg;
      belongGw = true;
      break;
    case OpType.GW_INFO_ACK:
      const { version, dev_model, dev_id } = msg;
      data = { version, dev_model, dev_id };
      belongGw = true;
      break;
    case OpType.LIGHT_HEATBEAT_DATA:
      const v = parseInt(msg.value as string, 16);
      data = {
        status: (v >> 16) & 0xff,
        mode: (v >> 8) & 0xff,
        version: v & 0xff,
      };
      console.log(data);
      break;
    default:
      break;
  }

  return { belongGw, data };
}

function genTopic(gw_mac: string) {
  return `/application/GW-BM-TCP/device/${gw_mac}/down`;
}

export interface CmdResult {
  topic: string;
  payload: object;
}
export const Cmd = (after?: (res: CmdResult) => any) => {
  const lightStatus = (
    gateway_mac: string,
    light_addr: number,
    status: number
  ) => {
    const topic = genTopic(gateway_mac);
    const result = {
      topic,
      payload: {
        opcode: OpType.LIGHT_SET_ONOFF,
       time_stamp : 1000,
        dest_addr: light_addr,
        value: status,
      },
    };
    if (after) {
      after(result);
    }
    return result;
  };
  const lightMode = (gateway_mac: string, light_addr: number, mode: number) => {
    const topic = genTopic(gateway_mac);
    const result = {
      topic,
      payload: {
        opcode: OpType.LIGHT_SET_MODE,
        mesh_dev_type: 0,
        dest_addr: light_addr,
        value: mode,
      },
    };
    if (after) {
      after(result);
    }
    return result;
  };
  return {
    lightStatus,
    lightMode,
  };
};
