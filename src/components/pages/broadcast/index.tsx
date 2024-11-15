import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Device, DeviceList } from "@/components/pages/broadcast/dev-list";
import { ListX, PlugZap, Radar, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";


import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { toast } from "sonner";

function Broadcast() {

  const [ip, setIp] = useState("239.255.255.250");
  const [port, setPort] = useState(31900);
  const [connected, setConnected] = useState(false);
  const [msgList, setMsgList] = useState<Device[]>([]);

  let avoidExtraCall = false;

  useEffect(() => {
    if (!avoidExtraCall) {
      avoidExtraCall = true;

      invoke("check_broadcast").then((res) => {
        setConnected(res as boolean);
      });

      listen("boracast_msg", ({ payload }) => {
        const dev = payload as Device;
        console.log(dev);
        setMsgList((list) => {
          for (let i = 0; i < list.length; i++) {
            if (list[i].ip === dev.ip) {
              list.splice(i, 1, dev);
              console.log(list);
              return [...list];
            }
          }
          return [...list, dev];
        });
      });
    }
  }, []);
  async function scan() {
    await invoke("scan");
  }

  function createBroadcast() {
    invoke("create_broadcast", { ip, port })
      .then((_) => {
        setConnected(true);
        toast.success("监听成功", {
          description: "UDP广播创建成功 " + ip + ":" + port,
        });
      })
      .catch((error) => {
        toast.error("监听失败", {
          description: error,
        });
      });
  }

  function cancelBroadcast() {
    invoke("cancel_broadcast")
      .then((_) => {
        setConnected(false);
      })
      .catch((error) => {
        toast.error("监听取消出错", {
          description: error,
        });
      });
  }

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center justify-between px-4 py-2">
        <div>
          <TabsList className="h-8 ml-auto">
            <TabsTrigger
              value="all"
              className="text-zinc-600 dark:text-zinc-200"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="eps"
              className="text-zinc-600 dark:text-zinc-200"
            >
              DCC
            </TabsTrigger>
            <TabsTrigger
              value="stm32"
              className="text-zinc-600 dark:text-zinc-200"
            >
              BLE GW
            </TabsTrigger>
          </TabsList>
        </div>

        <form>
          <div className="flex items-center w-full max-w-sm space-x-2">
            <Input
              className="w-32 h-8"
              type="text"
              defaultValue={ip}
              placeholder="Ip"
              onChange={(e) => setIp(e.currentTarget.value)}
            />
            <Input
              className="w-24 h-8"
              type="number"
              defaultValue={31900}
              placeholder="port"
              onChange={(e) => setPort(parseInt(e.currentTarget.value))}
            />
            {connected ? (
              <Button
                className="h-8"
                variant="secondary"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  cancelBroadcast();
                }}
              >
                <Unplug color="red" className="w-4 h-4 " />
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  createBroadcast();
                }}
              >
                <PlugZap color="green" className="w-10 h-5" />
              </Button>
            )}
          </div>
        </form>
      </div>
      <Separator />
      <div className="bg-background/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {connected && (
          <div className="flex items-end justify-between ">
            <div>
              <Button
                className="h-8 p-2 "
                onClick={(e) => {
                  e.preventDefault();
                  scan();
                }}
                variant="outline"
              >
                <Radar className="w-5 h-5 m-0 hover:animate-spin hover:stroke-orange-500" />
              </Button>
            </div>
            <div>
              <Button
                className="h-8 px-0"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  setMsgList([]);
                }}
                variant="outline"
              >
                <ListX color="red" className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      <Separator />
      <div className="h-2"></div>
      <TabsContent value="all" className="m-0">
        <DeviceList items={msgList} />
      </TabsContent>
      <TabsContent value="esp" className="m-0">
        <DeviceList items={msgList} />
      </TabsContent>
      <TabsContent value="stm32" className="m-0">
        <DeviceList items={msgList} />
      </TabsContent>
    </Tabs>
  );
}

export default Broadcast;
