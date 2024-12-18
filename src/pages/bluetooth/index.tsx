import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  List,
  PlugZap,
  Unplug,
  ListX,
  ArrowBigUpDash,
  ArrowBigDownDash,
  SquareArrowOutUpRight,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
//import { Textarea } from "@/components/ui/textarea";

import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { toast } from "sonner";

import { Tree, Gateway, CollapseButton, Light } from "./tree-view";
import { cn } from "@/lib/utils";
import useBluetoothContext from "./context";

import { ScrollArea } from "@/components/ui/scroll-area";
import LightView from "./light-view";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { statusList } from "./const";
import { Label } from "@/components/ui/label";

//const STORE_KEY = "LIGHT_TREE";

function Bluetooth() {
 // const [data, setData] = useState("");
  const [addr, setAddr] = useState("192.168.100.64");
  const [port, setPort] = useState(1883);
  const [username, setUsername] = useState("hyz");
  const [password, setPassword] = useState("hyz2017@)!&");
  const [connected, setConnected] = useState(false);

  const [beaconOutline, setBeaconOutline] = useState(3);
  const [beaconFilter, setBeaconFilter] = useState("");
 // const init_data = localStorageGet(STORE_KEY) || [];
  const { treeData, handleDate, history, setHistory, Cmd } =
    useBluetoothContext([]);

  let avoidExtraCall = false;
  let unlisten: UnlistenFn | undefined = undefined;
  useEffect(() => {
    if (!avoidExtraCall) {
      avoidExtraCall = true;
      listen("mqtt_msg", ({ payload }) => {
        handleDate(payload);
      }).then((v) => {
        unlisten = v;
      });
    }

    invoke("mqtt_state").then((res) => {
      console.log(res);
      const { connected } = res as { connected: boolean };

      setConnected(connected as boolean);
    });

    return () => {
      !!unlisten && unlisten();
      if (treeData.length > 0) {
       // localStorageSet(STORE_KEY, treeData);
      }
    };
  }, []);

  function mqttCreate() {
    const clientId = "ttt_" + Math.random().toString(36).substr(2, 9);
    const username = "hyz";
    const password = "hyz2017@)!&";
    const topic = "#";
    invoke("mqtt_create_client", {
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
          duration: 1000,
          description: "MQTT connected" + addr + ":" + port,
        });
      })
      .catch((error) => {
        toast.error("MQTT connecting error", {
          description: error,
        });
      });
  }

  function mqttClose() {
    invoke("mqtt_close_client")
      .then((_) => {
        setConnected(false);
      })
      .catch((error) => {
        toast.error("监听取消出错", {
          description: error,
        });
      });
  }

  function mqttPublish(
    topic: string,
    playload: string,
    qos = 0,
    retain = false
  ) {
    invoke("mqtt_publish", {
      topic,
      playload,
      qos,
      retain,
    })
      .then((_) => {
        toast.success("Done", {
          duration: 5000,
          description: "MQTT Publish:" + topic + "-->" + playload,
        });
      })
      .catch((error) => {
        toast.error("mqttPublish", {
          description: error,
        });
      });
  }

  function onStatusChange(gw_mac: string, addr: number, status: number) {
    const { topic, payload } = Cmd.lightStatus(gw_mac, addr, status);
    mqttPublish(topic, JSON.stringify(payload));
  }

  function onModeChange(gw_mac: string, addr: number, mode: number) {
    const { topic, payload } = Cmd.lightMode(gw_mac, addr, mode);
    mqttPublish(topic, JSON.stringify(payload));
  }

  function clearHistory() {
    setHistory([]);
  }

  return (
    <div className="flex flex-col flex-grow h-screen">
      <div className="bg-background/95 p-1 backdrop-blur supports-[backdrop-filter]:bg-background/60 ">
        <div >
          {!connected ? (
            <div className="flex justify-between w-full gap-3 px-1">
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
              <Button
                variant="secondary"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  mqttCreate();
                }}
              >
                <PlugZap color="green" className="w-10 h-6" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-end w-full">
              <Button
                variant="secondary"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  mqttClose();
                }}
              >
                <Unplug color="red" className="w-10 h-6" />
              </Button>
            </div>
          )}
       
        </div>
     
        {connected && (
         
          <div className="flex justify-between w-full gap-1 mt-1">
             <div className="flex items-center gap-x-3">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="beacon_outline" className="text-xs">信标过期(Min)</Label>
              <Input id="beacon_outline" type="number" step={1}  min={1} value ={beaconOutline} onChange={(e) => setBeaconOutline(parseInt(e.currentTarget.value))} className="w-20" />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="beacon_filter" className="text-xs">信标过滤(ID)</Label>
              <Input id="beacon_filter" type="text"  value ={beaconFilter} onChange={(e) => setBeaconFilter(e.currentTarget.value)} className="w-24" />
            </div>
            </div>
            {/* <Textarea
                rows={1}
                value={data}
                onChange={(e) => setData(e.currentTarget.value)}
              /> */}

            {/* <Button
                onClick={(e) => {
                  e.preventDefault();
                }}
                variant="outline"
              >
                <Send className="w-4 h-4 mr-2 animate-pulse" />
                Send
              </Button> */}
            <div>
              <Sheet modal={false}>
                <SheetTrigger asChild>
                  <Button variant="outline" size={"icon"}>
                    <List className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="h-screen p-2  sm:max-w-md w-[400px]">
                  <SheetHeader>
                    <SheetTitle>History [{history.length}]</SheetTitle>
                    <SheetDescription>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6"
                        onClick={clearHistory}
                      >
                        <ListX className="w-4 h-4 text-red-500" />
                      </Button>
                    </SheetDescription>
                  </SheetHeader>

                  <ScrollArea className="h-[calc(100%-70px)] ">
                    {history.map((item, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex flex-col items-start gap-2 p-1 mt-2 mr-3 text-xs text-left border rounded-lg hover:bg-accent w-[80%]",
                          item.dir === "down" ? "float-left" : "float-right"
                        )}
                      >
                        <div className="flex items-center w-full">
                          {item.dir === "up" ? (
                            <ArrowBigUpDash className="w-5 h-5 text-cyan-600" />
                          ) : (
                            <ArrowBigDownDash className="w-5 h-5 text-green-600" />
                          )}
                          <span className="ml-1">
                            {item.topic.replace(
                              "/application/GW-BM-TCP/device/",
                              ""
                            )}
                          </span>
                        </div>

                        <div>{JSON.stringify(item.payload, null, 4)}</div>
                      </div>
                    ))}
                  </ScrollArea>

                  <SheetFooter></SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        )}
      </div>

      <div className="relative h-[calc(100vh_-_80px)]  p-1 pt-1 m-1">
        <ScrollArea className="h-full">
          <Tree elements={treeData}>
            {treeData.map((gw) => {
              const title = (
                <div className="p-2 bg-gray-200 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span>
                      <b> {gw.name}</b>
                      <code className="text-orange-400">
                        {" "}
                        {gw.children?.length}
                      </code>
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <span className="flex p-0.5 rounded-md bg-slate-200 ">
                          <Settings2 className="h-4" />
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuGroup>
                          {statusList.map((item) => (
                            <DropdownMenuItem
                              key={item.value}
                              onClick={(event) => {
                                onStatusChange(gw.name, 0xffff, item.value);
                                event.stopPropagation();
                              }}
                            >
                              {item.title}
                              <DropdownMenuShortcut>
                                {item.icon}
                              </DropdownMenuShortcut>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div>
                    <div className="flex items-center text-xs">
                      <i className="text-xs text-neutral-600">
                        {gw.data.dev_model}
                      </i>
                      <Separator className="mx-1" orientation="vertical" />
                      <i className="text-blue-400">{gw.ipaddr} </i>
                      <a
                        target="_blank"
                        href={"http://" + gw.ipaddr}
                        className="ml-1"
                      >
                        <SquareArrowOutUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
              return (
                <Gateway element={title} value={gw.id} key={gw.id}>
                  {gw.children &&
                    gw.children.length > 0 &&
                    gw.children.map((child) => (
                      <Light key={child.id} value={child.id} isSelectable>
                        <LightView
                         beaconOutline={beaconOutline}
                         beaconFilter={beaconFilter}
                          info={child}
                          onStatusChange={(status) => {
                            onStatusChange(gw.id, child.addr, status);
                          }}
                          onModeChange={(mode) => {
                            onModeChange(gw.id, child.addr, mode);
                          }}
                        />
                      </Light>
                    ))}
                </Gateway>
              );
            })}

            <CollapseButton elements={treeData} />
          </Tree>
        </ScrollArea>
      </div>
    </div>
  );
}

export default Bluetooth;
