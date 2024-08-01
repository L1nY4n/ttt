import { TreeViewElement } from "@/components/extension/tree-view/tree-view-api";
import { useState } from "react";
import { Message } from "./protocol";


type Msg = {
    dup: boolean;
    topic: string;
    pkid: number;
    // qos: number;
    retain: boolean;
    payload: string;
    date: Date;
  };
  

export default function useBluetoothContext() {
    const [treeData, setTreeData] = useState<TreeViewElement[]>([]);
    const handleDate = (payload: unknown) => {
        const msg = payload as Msg;
        const tps = msg.topic.split("/");
        console.log(tps);
        if (
          tps[1] === "application" &&
          tps[2] === "GW-BM-TCP" &&
          tps[3] === "device" &&
          tps[5] === "up"
        ) {
          const gateway_mac = tps[4];
          console.log(gateway_mac);
          const payload = JSON.parse(msg.payload) as Message;
          console.log(payload);

          setTreeData((list) => {
            const index = list.findIndex((item) => {
              return item.id === gateway_mac;
            });
            if (index === -1) {
              list.push({
                id: gateway_mac,
                name: gateway_mac,
                date: msg.date,
                children: [
                  {
                    id: payload.src_addr!.toString(),
                    name: payload.src_addr!.toString(),
                    addr: payload.src_addr!,
                    date: msg.date,
                  },
                ],
                addr: 0,
              });
            } else {
              const i = list[index].children?.findIndex((item) => {
                return item.addr === payload.src_addr;
              });
              if (i === -1) {
                list[index].children?.push({
                  id: payload.src_addr!.toString(),
                  name: payload.src_addr!.toString(),
                  addr: payload.src_addr!,
                  date: msg.date,
                });
                list[index].children?.sort((a, b) => {
                  return a.addr - b.addr;
                });
              } else {
                // @ts-ignore
                list[index].children[i].date = msg.date;
              }
            }

            return [...list];
          });
        }
        
    }
   return {treeData, setTreeData,handleDate}
    
}
