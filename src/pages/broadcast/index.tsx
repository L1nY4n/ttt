import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Device, DeviceList } from "./dev-list";
import { ListX, PlugZap, Radar, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
        setMsgList((list) => {
          for (let i = 0; i < list.length; i++) {
            if (list[i].mac?.toString() === dev.mac?.toString()) {
              list.splice(i, 1, dev);
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
      .then(() => {
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
      .then(() => {
        setConnected(false);
      })
      .catch((error) => {
        toast.error("监听取消出错", {
          description: error,
        });
      });
  }

  return (
    <Tabs defaultValue="all" className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-14 flex-wrap items-end gap-x-3 gap-y-2 border-b px-3 py-2">
        <TabsList>
          <TabsTrigger value="all">
            All
          </TabsTrigger>
          <TabsTrigger value="eps">
            DCC
          </TabsTrigger>
          <TabsTrigger value="stm32">
            BLE GW
          </TabsTrigger>
        </TabsList>

        <form
          className="ml-auto flex flex-wrap items-end gap-2"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Multicast
            <Input
              className="w-40 bg-background"
              type="text"
              value={ip}
              disabled={connected}
              aria-label="Multicast address"
              onChange={(event) => setIp(event.currentTarget.value)}
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Port
            <Input
              className="w-24 bg-background"
              type="number"
              value={port}
              disabled={connected}
              aria-label="UDP port"
              onChange={(event) => setPort(parseInt(event.currentTarget.value))}
            />
          </label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={connected ? "outline" : "default"}
                size="icon"
                aria-label={connected ? "Stop UDP listener" : "Start UDP listener"}
                onClick={connected ? cancelBroadcast : createBroadcast}
              >
                {connected ? (
                  <Unplug className="h-4 w-4 text-destructive" />
                ) : (
                  <PlugZap className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {connected ? "Stop UDP listener" : "Start UDP listener"}
            </TooltipContent>
          </Tooltip>
        </form>
      </div>

      <div className="flex h-10 shrink-0 items-center justify-between border-b px-3">
        <div
          className="flex items-center gap-2 text-sm"
          aria-live="polite"
        >
          <span
            className={
              connected
                ? "h-2 w-2 rounded-full bg-emerald-500"
                : "h-2 w-2 rounded-full bg-muted-foreground/50"
            }
            aria-hidden="true"
          />
          <span className="font-medium">
            {connected ? "Listening" : "Stopped"}
          </span>
          <span className="text-muted-foreground">
            {connected ? `${ip}:${port}` : "UDP"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Scan for devices"
                disabled={!connected}
                onClick={scan}
              >
                <Radar className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Scan for devices</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Clear discovered devices"
                disabled={msgList.length === 0}
                onClick={() => setMsgList([])}
              >
                <ListX className="h-4 w-4 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear discovered devices</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <TabsContent value="all" className="m-0 h-full">
          <DeviceList items={msgList} />
        </TabsContent>
        <TabsContent value="eps" className="m-0 h-full">
          <DeviceList items={msgList} />
        </TabsContent>
        <TabsContent value="stm32" className="m-0 h-full">
          <DeviceList items={msgList} />
        </TabsContent>
      </div>
    </Tabs>
  );
}

export default Broadcast;
