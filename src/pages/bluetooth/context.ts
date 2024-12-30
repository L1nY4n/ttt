import { useEffect, useState } from "react";
import { Cmd, Message, OpType, handleMessage, CmdResult } from "./protocol";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { BeaconItem, GatewayItem, State } from "@/types";

type MqttMsg = {
  dup: boolean;
  topic: string;
  pkid: number;
  // qos: number;
  retain: boolean;
  payload: string;
  date: Date;
};

interface HistoryItem extends CmdResult {
  dir: "up" | "down";
}

export default function useBluetoothContext(init_data: GatewayItem[] | null) {
  const [state, setState] = useState<State>({
    connected: false,
    gateway: {},
    light: {},
    beacon: {},
  });
  const [connected, setConnected] = useState(false);
  const [treeData, setTreeData] = useState<GatewayItem[]>(
    init_data === null ? [] : init_data
  );

  const [history, setHistory] = useState<HistoryItem[]>([]);

  let avoidExtraCall = false;
  let mqtt_u: UnlistenFn | undefined = undefined;
  let beacon_u: UnlistenFn | undefined = undefined;
  useEffect(() => {
    if (!avoidExtraCall) {
      avoidExtraCall = true;
      listen("mqtt_msg", ({ payload }) => {
        handleDate(payload);
      }).then((v) => {
        mqtt_u = v;
      });

      listen("beacon_update", ({ payload }) => {
        let beacon = payload as BeaconItem;
        setState((s) => {
          s.beacon[beacon.id] = beacon;
          return { ...s };
        });
      }).then((v) => {
        beacon_u = v;
      });

      invoke("mqtt_state").then((res) => {
        const s = res as State;
        setState(s);
        setConnected(s.connected);
      });
    }

    return () => {
      !!mqtt_u && mqtt_u();
      !!beacon_u && beacon_u();
    };
  }, []);

  const handleDate = (payload: unknown) => {
    const mqttMsg = payload as MqttMsg;
    const tps = mqttMsg.topic.split("/");
    if (
      tps[1] === "application" &&
      tps[2] === "GW-BM-TCP" &&
      tps[3] === "device" &&
      tps[5] === "up"
    ) {
      const gateway_mac = tps[4];
      const msg = JSON.parse(mqttMsg.payload) as Message;
      setHistory((list) => {
        if (list.length > 1000) {
          list.shift();
        }
        return [
          ...list,
          {
            topic: mqttMsg.topic,
            payload: msg,
            dir: "up",
          },
        ];
      });
      const { belongGw, updater: updater } = handleMessage(msg);
      setTreeData((list) => {
        let index = list.findIndex((item) => {
          return item.mac === gateway_mac;
        });
        if (index === -1) {
          index = list.length;
          list.push({
            id: gateway_mac,
            mac: gateway_mac,
            addr: 0,
            name: gateway_mac,
            date: mqttMsg.date,
            model: "",
            version: 0,
            data: {}
          });
        }

        if (belongGw) {
          list[index] = {
            ...list[index],
            data: updater(list[index].data),
            date: mqttMsg.date,
          };
        } else {
          if (!!msg.src_addr) {
            const i = list[index].children?.findIndex((item) => {
              return item.addr === msg.src_addr;
            });

            if (i === -1) {
              list[index].children?.push({
                name: msg.src_addr!.toString(),
                addr: msg.src_addr!,
                date: mqttMsg.date,
                position: {
                  x: 0,
                  y: 0,
                  z: 0,
                },
                gateway: "",
                status: 0,
                version: 0,
                mode: 0,
                id: "",
                model: "",
                data: {},
                mac: ""
              });
              list[index].children?.sort((a, b) => {
                return a.addr - b.addr;
              });
            } else {
              // @ts-ignore
              list[index].children[i] = {
                // @ts-ignore
                ...list[index].children[i],
                // @ts-ignore
                data: updater(list[index].children[i].data),
                date: mqttMsg.date,
              };
            }
          }
        }

        if (msg.opcode === OpType.LIGHT_HEATBEAT_DATA) {
        } else if (msg.opcode === OpType.GW_HEATBEAT_DATA) {
          list[index].ip = msg.ipaddr;
        } else {
          if (belongGw) {
            list[index] = {
              ...list[index],
              data: updater(list[index].data),
            };
          } else {
            // const i = list[index].children?.findIndex((item) => {
            //   return item.addr === msg.src_addr;
            // });
          }
        }

        return list;
      });
    }
  };

  const CmdWithHistory = Cmd((res) => {
    console.log(res);
    setHistory((list) => {
      return [
        ...list,
        {
          ...res,
          dir: "down",
        },
      ];
    });
  });

  return {
    connected,
    state,
    setState,
    setConnected,
    treeData,
    setTreeData,
    history,
    setHistory,
    Cmd: CmdWithHistory,
  };
}
