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
  Cable,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "./components/ui/button";
import { Nav } from "./nav";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Device, DeviceList } from "./dev-list";

function App() {
  const [isCollapsed, _setIsCollapsed] = useState(false);

  const [_greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [_ip, setIp] = useState("224.1.1.1");
  const [_port, setPort] = useState(31900);
  const [msgList, setMsgList] = useState<Device[]>([]);
 let avoidExtraCall = false

  useEffect(() => {
    if (!avoidExtraCall) {
      avoidExtraCall = true
      console.log("create listenner");
      listen("msg", ({ payload }) => {
        console.log(payload);
        setMsgList((msgList) => [...msgList, payload as Device]);
      })
    }
  }, []);
  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <TooltipProvider delayDuration={0}>
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
            isCollapsed &&
              "min-w-[50px] transition-all duration-300 ease-in-out"
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
        <ResizablePanel defaultSize={440} minSize={30}>
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  greet();
                }}
              >
                <div className="flex items-center w-full max-w-sm space-x-2">
                  <Input
                    type="text"
                    defaultValue={"224.1.1.1"}
                    placeholder="Ip"
                    onChange={(e) => setIp(e.currentTarget.value)}
                  />
                  <Input
                    type="number"
                    defaultValue={31900}
                    placeholder="port"
                    onChange={(e) => setPort(parseInt(e.currentTarget.value))}
                  />
                  <Button type="submit" variant="secondary">
                    <Cable color="orange"></Cable>
                  </Button>
                </div>
              </form>

              <div className="flex items-end gap-2 py-2">
                <Textarea onChange={(e) => setName(e.currentTarget.value)} />
                <Button
                  onClick={() => {
                    greet();
                  }}
                  variant="outline"
                >
                  <Radar className="w-4 h-4 mr-2 animate-spin" />
                  Search ...
                </Button>
              </div>
            </div>
            <Separator />
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

          <Separator />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel
          defaultSize={1000 - 440 - 256}
          minSize={30}
        ></ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}

export default App;