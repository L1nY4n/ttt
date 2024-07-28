import { useEffect, useState } from "react";

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./globals.css";

import {
  ArchiveX,
  Send,
  RadarIcon,
  PocketKnife,
  Settings,
  Radar,
  Unplug,
  PlugZap,

  ListX,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Nav } from "./nav";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Device, DeviceList } from "./dev-list";

type SystemEvent = {
  title: string;
  description: string;
  datetime: Date;
};

function App() {
  const [isCollapsed, _setIsCollapsed] = useState(false);

  const [data, setData] = useState("");
  const [ip, setIp] = useState("224.1.1.1");
  const [port, setPort] = useState(31900);
  const [connected, setConnected] = useState(false);
  const [msgList, setMsgList] = useState<Device[]>([]);

  const { toast } = useToast();

  let avoidExtraCall = false;

  useEffect(() => {
    if (!avoidExtraCall) {
      avoidExtraCall = true;
      listen("boracast_msg", ({ payload }) => {
        console.log(payload);
        setMsgList((msgList) => [...msgList, payload as Device]);
      });

      listen("system_msg", ({ payload }) => {
        const ev = payload as SystemEvent;
        toast({
          title: ev.title,
          description: ev.description,
        });
      });
    }
  }, []);
  async function scan() {
    await invoke("scan", { data: data });
  }

  function createBroadcast() {
    invoke("create_broadcast", { ip, port })
      .then((_) => {
        setConnected(true);
        toast({
          title: "监听成功",
          description: "UDP广播创建成功 " + ip + ":" + port,
        });
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "监听失败",
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
        toast({
          variant: "destructive",
          title: "监听取消失败",
          description: error,
        });
      });
  }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      onLayout={(sizes: number[]) => {
        document.cookie = `react-resizable-panels:layout=${JSON.stringify(
          sizes
        )}`;
      }}
      className="h-full max-h-[800px] items-stretch"
    >
      <ResizablePanel
        defaultSize={265}
        collapsedSize={15}
        collapsible={true}
        minSize={15}
        maxSize={20}
        // onCollapse={
        //   (collapsed) => {
        //   setIsCollapsed(collapsed)
        // }
        // }
        className={cn(
          isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out"
        )}
      >
        <div
          className={cn(
            "flex h-[52px] items-center justify-center",
            isCollapsed ? "h-[52px]" : "px-2"
          )}
        >
          <div className="flex items-center h-5 space-x-4 text-sm">
            <PocketKnife />
            <Separator orientation="vertical" />
            <Label>HYZ </Label>
          </div>
        </div>
        <Separator />
        <Nav
          isCollapsed={isCollapsed}
          links={[
            {
              title: "Discover",
              label: "11",
              icon: RadarIcon,
              variant: "default",
            },

            {
              title: "XXX",
              label: "",
              icon: Send,
              variant: "ghost",
            },
            {
              title: "...",
              label: "",
              icon: ArchiveX,
              variant: "ghost",
            },
          ]}
        />
        <Separator />
        <Nav
          isCollapsed={isCollapsed}
          links={[
            {
              title: "Setting",
              label: "...",
              icon: Settings,
              variant: "ghost",
            },
          ]}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={440} minSize={40}>
        <Tabs defaultValue="all">
          <div className="flex items-center px-4 py-2">
            <h1 className="text-xl font-bold">扫描</h1>
            <TabsList className="ml-auto">
              <TabsTrigger
                value="all"
                className="text-zinc-600 dark:text-zinc-200"
              >
                所有设备
              </TabsTrigger>
              <TabsTrigger
                value="eps"
                className="text-zinc-600 dark:text-zinc-200"
              >
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
          <div className="bg-background/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <form>
              <div className="flex items-center w-full max-w-sm space-x-2">
          
                <Input
                  className="w-40"
                  type="text"
                  defaultValue={"224.1.1.1"}
                  placeholder="Ip"
                  onChange={(e) => setIp(e.currentTarget.value)}
                />
                <Input
                  className="w-24"
                  type="number"
                  defaultValue={31900}
                  placeholder="port"
                  onChange={(e) => setPort(parseInt(e.currentTarget.value))}
                />
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
            </form>
            {connected && (
              <div className="flex items-end gap-2 py-1 ">
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
                  <Radar className="w-4 h-4 mr-2 animate-spin" />
                  Search ...
                </Button>
                <Button
                    size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                   setMsgList([])
                  }}
                  variant="destructive"
                >
                  <ListX className="w-10 h-6" />
                </Button>
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
        aaa
        <Separator />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel
        defaultSize={1000 - 440 - 256}
        minSize={30}
      ></ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default App;
