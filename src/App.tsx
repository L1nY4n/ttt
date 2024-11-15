import { useEffect, useState } from "react";

import { listen } from "@tauri-apps/api/event";
import "./globals.css";
import { RadarIcon, PocketKnife, Settings, BluetoothIcon,Usb } from "lucide-react";

import { cn } from "@/lib/utils";
import { Route, Routes } from "react-router-dom";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";

import { toast } from "sonner";
import { Nav } from "./nav";

import { Label } from "./components/ui/label";

import Broadcast from "./components/pages/broadcast/index.tsx";
import SerialPort from "./components/pages/serialport";
import BluetoothView from "@/components/pages/bluetooth/index";

type SystemEvent = {
  title: string;
  description: string;
  datetime: Date;
};

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  //const [windowsSize,setWindowsSize] = useState(800);
  const  [maxSize,setMaxSize] = useState(30);
  const [collapsedSize, setCollapsedSize] = useState(5);
  
  let avoidExtraCall = false;

  useEffect(() => {
    if (!avoidExtraCall) {
      avoidExtraCall = true;
      listen("system_msg", ({ payload }) => {
        const ev = payload as SystemEvent;
        toast.info(ev.title, {
          description: ev.description,
        });
      });
    }
  }, []);

  useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
           //   setWindowsSize(entry.contentRect.width)
      
              setMaxSize(200 / entry.contentRect.width * 100)
              setCollapsedSize(50 / entry.contentRect.width * 100)
          
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
      direction="horizontal"
      onLayout={(sizes: number[]) => {
        document.cookie = `react-resizable-panels:layout=${JSON.stringify(
          sizes
        )}`;
      }}
      className="items-stretch h-screen"
    >
      <ResizablePanel
        
        defaultSize={25}
        collapsedSize={collapsedSize}
        collapsible={true}
        minSize={18}
        maxSize={maxSize}
        onCollapse={() => {
          setIsCollapsed(true);
        }}
        onExpand={() => {
          setIsCollapsed(false);
        }}
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
            <PocketKnife className="w-8 h-8"  />
            {!isCollapsed && <Separator  orientation="vertical" />}
            {!isCollapsed && <Label >X </Label>}
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
              animate: "animate-spin"
            },

            {
              title: "Serialport",
              path: "/serialport",
              label: "",
              icon: Usb,
              variant: "ghost",
            },
            {
              title: "mqtt ble",
              path: "/bluetooth",
              label: "",
              icon: BluetoothIcon,
              variant: "ghost",
              animate: "animate-bounce"
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
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75} minSize={70}>
        <Routes>
          <Route path="/" element={<Broadcast />} />
          <Route path="/serialport" element={<SerialPort  />} />
          <Route path="/bluetooth" element={<BluetoothView  />} />
        </Routes>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default App;
