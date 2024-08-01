import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  PlugZap,

  Router,
  Send,
  Settings,
  Unplug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { toast } from "sonner";

import {
  Tree,
  Gateway,
  CollapseButton,

  Light,
} from "@/components/extension/tree-view/tree-view-api";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { zhCN } from "date-fns/locale";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import useBluetoothContext from "./context";


function Bluetooth() {
  const [data, setData] = useState("");
  const [addr, setAddr] = useState("192.168.101.112");
  const [port, setPort] = useState(1883);
  const [username, setUsername] = useState("hyz");
  const [password, setPassword] = useState("hyz2017@)!&");
  const [connected, setConnected] = useState(false);
 const { treeData,handleDate } = useBluetoothContext();

  let avoidExtraCall = false;

  useEffect(() => {
    if (!avoidExtraCall) {
      avoidExtraCall = true;
      listen("mqtt_msg", ({ payload }) => {
        handleDate(payload);
      });
    }
  }, []);
  async function scan() {
    await invoke("scan", { data: data });
  }

  function createBroadcast() {
    const clientId = "clientxxxxx";
    const username = "hyz";
    const password = "hyz2017@)!&";
    const topic = "#";
    invoke("create_mqtt_client", {
      clientId,
      addr,
      port,
      username,
      password,
      topic,
    })
      .then((_) => {
        setConnected(true);
        toast.success("NICE !!!", {
          description: "MQTT connected" + addr + ":" + port,
        });
      })
      .catch((error) => {
        toast.error("监听失败", {
          description: error,
        });
      });
  }

  function cancelBroadcast() {
    invoke("close_mqtt_client")
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
      <div className="flex items-center px-4 py-2">
        <h1 className="text-xl font-bold"></h1>
        <TabsList className="ml-auto">
          <TabsTrigger value="all" className="text-zinc-600 dark:text-zinc-200">
            All
          </TabsTrigger>
          <TabsTrigger value="eps" className="text-zinc-600 dark:text-zinc-200">
            ESP
          </TabsTrigger>
          <TabsTrigger
            value="stm32"
            className="text-zinc-600 dark:text-zinc-200"
          >
            STM32
          </TabsTrigger>
        </TabsList>
      </div>
      <Separator />
      <div className="bg-background/95 p-1 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex justify-between w-full gap-3">
          {!connected ? (
            <div className="flex items-center gap-x-1">
              <Input
                size={30}
                className="w-36"
                type="text"
                defaultValue={addr}
                placeholder="add"
                onChange={(e) => setAddr(e.currentTarget.value)}
              />
              <Input
                className="w-20"
                type="number"
                defaultValue={port}
                placeholder="port"
                onChange={(e) => setPort(parseInt(e.currentTarget.value))}
              />
              <Separator orientation="vertical" />
              <Input
                size={30}
                className="w-20"
                type="text"
                defaultValue={username}
                placeholder="username"
                onChange={(e) => setUsername(e.currentTarget.value)}
              />
              <Input
                size={30}
                className="w-32"
                type="text"
                defaultValue={password}
                placeholder="password"
                onChange={(e) => setPassword(e.currentTarget.value)}
              />
            </div>
          ) : (
            <div className="flex gap-1 py-1 items-end w-[calc(100%_-_4rem)]">
              <Textarea
                rows={1}
                value={data}
                onChange={(e) => setData(e.currentTarget.value)}
              />

              <Button
                onClick={(e) => {
                  e.preventDefault();
                  scan();
                }}
                variant="outline"
              >
                <Send className="w-4 h-4 mr-2 animate-pulse" />
                Send
              </Button>
            </div>
          )}

          {connected ? (
            <Button
              variant="secondary"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                cancelBroadcast();
              }}
            >
              <Unplug color="red" className="w-10 h-6" />
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
              <PlugZap color="green" className="w-10 h-6" />
            </Button>
          )}
        </div>
      </div>
      <Separator />
      <div className="h-2"></div>
      <TabsContent value="all" className="m-0">
        <Tree className="" elements={treeData}>
          {treeData.map((gw) => (
            <Gateway element={gw.name} value={gw.id} key={gw.id}>
              {gw.children &&
                gw.children.length > 0 &&
                gw.children.map((child) => (
                  <Light key={child.id} value={child.id} isSelectable>
                    <div className="relative w-40 p-1">
                      <div className="flex items-center gap-2 w-30">
                        <Router className="w-4 h-4" />
                        <div className="text-[75%] text-cyan-600">
                          {formatDistanceToNow(child.date, {
                            locale: zhCN,
                            addSuffix: true,
                            includeSeconds: true,
                          })}
                        </div>
                      </div>
                      <Sheet modal={false}>
                        <SheetTrigger asChild>
                        <button
                            className="absolute top-1 right-0 flex items-center justify-center w-5 h-5 text-center border rounded-[50%] bg-border "
                         
                          >
                            <Settings className="w-4 h-4 " />
                          </button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>addr={child.addr}</SheetTitle>
                            <SheetDescription>
                            gateway={gw.name}
                            </SheetDescription>
                          </SheetHeader>
                          <div className="py-2">
                              <Button variant="outline">
                                 
                              </Button>
                          </div>
                          <SheetFooter>
                            <SheetClose asChild>
                              <Button type="submit">Save changes</Button>
                            </SheetClose>
                          </SheetFooter>
                        </SheetContent>
                      </Sheet>
                
                      <div>addr:{child.addr}</div>
                    </div>
                  </Light>
                ))}
            </Gateway>
          ))}

          <CollapseButton elements={treeData} />
        </Tree>
      </TabsContent>
      <TabsContent value="esp" className="m-0"></TabsContent>
      <TabsContent value="stm32" className="m-0"></TabsContent>
    </Tabs>
  );
}

export default Bluetooth;
