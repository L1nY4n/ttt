import { useEffect, useRef, useState } from "react";

import { listen } from "@tauri-apps/api/event";
import { RadarIcon, Settings, BluetoothIcon, Usb, QrCode, RefreshCw } from "lucide-react";
import { check } from "@tauri-apps/plugin-updater";
import { invoke } from "@tauri-apps/api/core";
import { cn } from "@/lib/utils";
import { Route, Routes } from "react-router-dom";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Nav } from "./nav.tsx";

import Broadcast from "@/pages/broadcast/index.tsx";
import SerialPort from "@//pages/serialport.tsx";
import BluetoothView from "@//pages/bluetooth/index";
import QRAC from "@/pages/qr_ac/index.tsx";

type SystemEvent = {
  title: string;
  description: string;
  datetime: Date;
};

function Home() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  //const [windowsSize,setWindowsSize] = useState(800);
  const [maxSize, setMaxSize] = useState(30);
  const [collapsedSize, setCollapsedSize] = useState(5);
  const hasCheckedForUpdates = useRef(false);

  function openUpdater() {
    void invoke("check_update").catch((error) => {
      toast.error("无法打开更新窗口", {
        description: String(error),
      });
    });
  }

  useEffect(() => {
    let unlistenSystemMessage: (() => void) | undefined;

    void (async () => {
      unlistenSystemMessage = await listen("system_msg", ({ payload }) => {
        const ev = payload as SystemEvent;
        toast.info(ev.title, {
          description: ev.description,
        });
      });

      if (!hasCheckedForUpdates.current) {
        hasCheckedForUpdates.current = true;

        try {
          const update = await check();
          if (update) {
            await invoke("check_update");
          }
        } catch (error) {
          console.warn("Unable to check for updates at startup", error);
        }
      }
    })();

    return () => {
      unlistenSystemMessage?.();
    };
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        //   setWindowsSize(entry.contentRect.width)

        setMaxSize((200 / entry.contentRect.width) * 100);
        setCollapsedSize((50 / entry.contentRect.width) * 100);
      }
    });

    observer.observe(document.body);

    // Cleanup function
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      onLayoutChanged={(sizes) => {
        document.cookie = `react-resizable-panels:layout=${JSON.stringify(
          sizes
        )}`;
      }}
      className="items-stretch h-screen"
    >
      <ResizablePanel
        defaultSize="25"
        collapsedSize={`${collapsedSize}%`}
        collapsible={true}
        minSize="18"
        maxSize={`${maxSize}%`}
        onResize={({ asPercentage }) => {
          setIsCollapsed(asPercentage <= collapsedSize);
        }}
        className={cn(
          "flex h-full flex-col",
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
            <img className="w-8 h-8" src="hyz_logo.png" alt="logo" />
          </div>
        </div>
        <Separator />
        <Nav
          isCollapsed={isCollapsed}
          links={[
            {
              title: "Scan",
              label: "-",
              path: "/",
              icon: RadarIcon,
              variant: "default",
              animate: "animate-spin",
            },

            {
              title: "Serialport",
              path: "/serialport",
              label: "",
              icon: Usb,
              variant: "ghost",
            },
            {
              title: "BLE",
              path: "/ble",
              label: "",
              icon: BluetoothIcon,
              variant: "ghost",
              animate: "animate-bounce",
            },
            {
              title: "QR ac",
              path: "/qrac",
              label: "",
              icon: QrCode,
              variant: "ghost",
              animate: "animate-plus",
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
              path: "/setting",
              icon: Settings,
              variant: "ghost",
            },
          ]}
        />
        <div className={cn("mt-auto px-2 pb-2", isCollapsed && "flex justify-center")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size={isCollapsed ? "icon" : "sm"}
                className={cn(!isCollapsed && "w-full justify-start")}
                onClick={openUpdater}
              >
                <RefreshCw className="size-4" />
                {!isCollapsed && <span>检查更新</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">检查更新</TooltipContent>
          </Tooltip>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="75" minSize="70">
        <Routes>
          <Route index element={<Broadcast />} />
          <Route path="/serialport" element={<SerialPort />} />
          <Route path="/ble" element={<BluetoothView />} />
          <Route path="/qrac" element={<QRAC />} />
        </Routes>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default Home;
