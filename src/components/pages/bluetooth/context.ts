import { GatewayItem } from ".//tree-view";
import { useState } from "react";
import { Cmd, Message, OpType, handleMessage, CmdResult } from "./protocol";

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
  const [treeData, setTreeData] = useState<GatewayItem[]>(
    init_data === null ? [] : init_data
  );

  const [history, setHistory] = useState<HistoryItem[]>([]);
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
      console.log(gateway_mac);
      const msg = JSON.parse(mqttMsg.payload) as Message;

      setHistory((list) => {
        return [
          ...list,
          {
            topic: mqttMsg.topic,
            payload: msg,
            dir: "up",
          },
        ];
      });
      const { belongGw, data } = handleMessage(msg);
      setTreeData((list) => {
        let index = list.findIndex((item) => {
          return item.id === gateway_mac;
        });
        if (index === -1) {
          index = list.length;
          list.push({
            id: gateway_mac,
            name: gateway_mac,
            date: mqttMsg.date,
            data: {},
            children: [],
            addr: 0,
          });
        }

        if (belongGw) {
          list[index] = {
            ...list[index],
            data: { ...list[index].data, ...data },
            date: mqttMsg.date,
          };
        } else {
          if (!!msg.src_addr) {
            const i = list[index].children?.findIndex((item) => {
              return item.addr === msg.src_addr;
            });

            if (i === -1) {
              list[index].children?.push({
                id: msg.src_addr!.toString(),
                name: msg.src_addr!.toString(),
                addr: msg.src_addr!,
                data,
                date: mqttMsg.date,
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
                data: { ...list[index].children[i].data, ...data },
                date: mqttMsg.date,
              };
            }
          }
        }

        if (msg.opcode === OpType.LIGHT_HEATBEAT_DATA) {
        } else if (msg.opcode === OpType.GW_HEATBEAT_DATA) {
          list[index].ipaddr = msg.ipaddr;
        } else {
          if (belongGw) {
            list[index] = {
              ...list[index],
              data: { ...list[index].data, ...data },
            };
          } else {
            const i = list[index].children?.findIndex((item) => {
              return item.addr === msg.src_addr;
            });
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
    treeData,
    setTreeData,
    history,
    setHistory,
    handleDate,
    Cmd: CmdWithHistory,
  };
}
