import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";

import {} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { EggOff, Link, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { ScrollArea } from "../ui/scroll-area";

import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { CanvasAddon } from "@xterm/addon-canvas";
import "@xterm/xterm/css/xterm.css";

import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
let msgReceiver: UnlistenFn | null = null;
let    xterm: Terminal | null = null;
// const  shellprompt= ">> ";
const fitAddon = new FitAddon();

export default function SerialPort() {
  interface SerialPortInfo {
    portName: string;
    portType: string;
  }

  interface SerialPortRecvMsg {
    content: string;
    date: string;
  }

  enum DataBits {
    Five = "Five",
    Six = "Six",
    Seven = "Seven",
    Eight = "Eight",
  }

  enum StopBits {
    One = "One",
    Two = "Two",
  }

  enum Parity {
    None = "None",
    Even = "Even",
    Odd = "Odd",
    Mark = "Mark",
    Space = "Space",
  }

  const BAUD_RATE_LIST = [
    300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 56000, 57600, 115200,
    128000, 256000, 460800,
  ];

  interface SerialPort extends SerialPortInfo {
    baudRate: number;
    dataBits: DataBits;
    parity: Parity;
    stopBits: StopBits;
    connected: boolean;
  }

  interface SerialPortGroup {
    [key: string]: SerialPortInfo[];
  }

  let [portGropt, setPortGroup] = useState<SerialPortGroup>(
    {} as SerialPortGroup
  );

  let [selectedPort, setSelectedPort] = useState<SerialPort>({
    portName: "",
    portType: "",
    baudRate: 9600,
    dataBits: DataBits.Eight,
    parity: Parity.None,
    stopBits: StopBits.One,
    connected: false,
  });

  let [msgList, setMsgList] = useState<SerialPortRecvMsg[]>([]);
  let [getSerialPortLoading, setGetSerialPortLoading] = useState(false);
  let [termMode, setTermMode] = useState(false);
  let [sendMsg, setSendMsg] = useState("");
  const termRef = useRef<HTMLDivElement>(null);





  useEffect(() => {
    getSerialPortList();
  }, []);

  const createMsgListener = async (inTerm: boolean) => {
      console.log(msgReceiver)
    if (msgReceiver !== null) {
      console.log("unlisten")
      msgReceiver();
    }
    console.log("termMode",inTerm)
    if (inTerm) {
      msgReceiver = await listen("seialport_recv", ({ payload }) => {
        const dev = payload as SerialPortRecvMsg;
        console.log("xterm.write")
        
          xterm?.write(dev.content);
      });
    }else{
      msgReceiver = await listen("seialport_recv", ({ payload }) => {
        const dev = payload as SerialPortRecvMsg;
        setMsgList((list) => {
          return [...list, dev];
        });
      });
    }
    console.log(msgReceiver)
  };

  const ToggleTermMode = (isTerm: boolean) => {
    setTermMode(isTerm);
    if (isTerm) {
      if (termRef.current ) {
        console.log(termRef.current?.getBoundingClientRect())
        console.log(termRef.current?.style)
        if(xterm === null){
        xterm = new Terminal({
          cursorBlink: true,
          allowProposedApi: true,
          convertEol: true
        }

        );


        xterm.onKey (({key,domEvent: ev})=> {
           console.log(key, ev)
        })
  
        xterm.loadAddon(fitAddon);
        xterm.loadAddon(new CanvasAddon());
        xterm.open(termRef.current);
        fitAddon.fit();
        xterm.onData((data) => {
          send(data);
        });
      }else{
        fitAddon.fit();
      }
      }
    }

    createMsgListener(isTerm);
  };

  const getSerialPortList = () => {
    console.log("getSerialPortList");
    setGetSerialPortLoading(true);
    invoke("available_ports").then((ports) => {
      const group = (ports as SerialPortInfo[]).reduce(
        (acc: SerialPortGroup, cur: SerialPortInfo) => {
          if (!acc[cur.portType]) {
            acc[cur.portType] = [];
          }
          acc[cur.portType].push(cur);
          return acc;
        },
        {}
      );
      setGetSerialPortLoading(false);
      setPortGroup(group as SerialPortGroup);
    });
  };

  const connect = () => {
    invoke("open_port", {
      portName: selectedPort.portName,
      baudRate: selectedPort.baudRate,
      dataBits: selectedPort.dataBits,
      parity: selectedPort.parity,
      stopBits: selectedPort.stopBits,
    })
      .then((_) => {
        createMsgListener(termMode);
        toast.success("Open Port Success", {
          description: selectedPort.portName,
        });
      })
      .catch((e) => {
        toast.error("Open Port Error", {
          description: e,
        });
      });
  };

  const disconnect = () => {
    invoke("close_port", { portName: selectedPort.portName })
      .then((res) => {
        console.log(res);
        toast.success("Close Port Success", {
          description: selectedPort.portName,
        });
      })
      .catch((e) => {
        toast.error("Close Port Error", {
          description: e,
        });
      });
  };

  const send = (msg: string) => {
    invoke("write_port", { portName: selectedPort.portName, msg: msg })
      .then((res) => {
        console.log(res);
      })
      .catch((e) => {
        toast.error("Close Port Error", {
          description: e,
        });
      });
  };

  const [maxSize, setMaxSize] = useState(30);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const observer = new ResizeObserver((entries) => {
      fitAddon.fit();
      console.log("ffff")
      for (let entry of entries) {

        setMaxSize((300 / entry.contentRect.width) * 100);
      }
    });

    observer.observe(rootRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className="w-full h-full">
      <ResizablePanelGroup direction={"horizontal"}>
        <ResizablePanel defaultSize={30} maxSize={maxSize}>
          <ul className="grid w-full gap-3 p-2">
            <li className="flex items-center justify-between">
              <Label>Port Name</Label>
              <Select
                defaultValue={selectedPort.portName}
                onValueChange={(v) => {
                  setSelectedPort({ ...selectedPort, portName: v });
                }}
              >
                <SelectTrigger className="w-[120px] h-5">
                  <SelectValue placeholder="Select a port" />
                </SelectTrigger>
                <SelectContent>
                  <div className="flex items-center justify-end mb-1">
                    <Button
                      className="w-5 h-5 "
                      size="icon"
                      onClick={() => getSerialPortList()}
                    >
                      <RefreshCw
                        className={cn(
                          "w-3 h-3",
                          getSerialPortLoading && " animate-spin"
                        )}
                      />
                    </Button>
                  </div>
                  <Separator />
                  {Object.entries(portGropt).map(([key, ports]) => (
                    <SelectGroup key={key}>
                      <SelectLabel>
                        <Badge className="text-xs" variant="outline">
                          {key}
                        </Badge>
                      </SelectLabel>
                      {ports.map((port, index) => (
                        <SelectItem value={port.portName} key={index}>
                          {port.portName}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </li>

            <li className="flex items-center justify-between">
              <Label>Baud Rate</Label>
              <Select
                defaultValue={selectedPort.baudRate.toString()}
                onValueChange={(v) => {
                  setSelectedPort({ ...selectedPort, baudRate: parseInt(v) });
                }}
              >
                <SelectTrigger className="w-[100px] h-5">
                  <SelectValue placeholder="Baud.." />
                </SelectTrigger>
                <SelectContent>
                  {BAUD_RATE_LIST.map((x) => (
                    <SelectItem value={"" + x} key={x}>
                      {" "}
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </li>
            <li className="flex items-center justify-between">
              <Label>Data Bits</Label>
              <Select
                defaultValue={selectedPort.dataBits}
                onValueChange={(v) => {
                  setSelectedPort({ ...selectedPort, dataBits: v as DataBits });
                }}
              >
                <SelectTrigger className="w-[100px] h-5">
                  <SelectValue placeholder="Data Bits" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { label: "5", value: "Five" },
                    { label: "6", value: "Six" },
                    { label: "7", value: "Seven" },
                    { label: "8", value: "Eight" },
                  ].map((x) => (
                    <SelectItem value={x.value} key={x.value}>
                      {" "}
                      {x.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </li>
            <li className="flex items-center justify-between">
              <Label>Stop Bits</Label>
              <Select
                defaultValue={selectedPort.stopBits}
                onValueChange={(v) => {
                  setSelectedPort({ ...selectedPort, stopBits: v as StopBits });
                }}
              >
                <SelectTrigger className="w-[100px] h-5">
                  <SelectValue placeholder="Stop Bits" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { label: "1", value: "One" },
                    { label: "2", value: "Two" },
                  ].map((x) => (
                    <SelectItem value={x.value} key={x.value}>
                      {" "}
                      {x.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </li>
            <li className="flex items-center justify-between">
              <Label>Parity</Label>
              <Select
                defaultValue={selectedPort.parity}
                onValueChange={(v) => {
                  setSelectedPort({ ...selectedPort, parity: v as Parity });
                }}
              >
                <SelectTrigger className="w-[100px] h-5">
                  <SelectValue placeholder="Parity" />
                </SelectTrigger>
                <SelectContent>
                  {["None", "Even", "Odd", "Mark"].map((x) => (
                    <SelectItem value={x} key={x}>
                      {" "}
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </li>
          </ul>
          <Separator />
          <div className="flex justify-between p-1">
            <div className="flex items-center self-start space-x-2">
              <Switch
                id="term-mode"
                checked={termMode}
                onCheckedChange={ToggleTermMode}
              />
              <Label htmlFor="term-mode">Term </Label>
            </div>
            <Button
              className="h-5 hover:bg-red-400"
              onClick={() => {
                disconnect();
              }}
            >
              <EggOff className="w-6 h-4" />
            </Button>
            <Button
              className="h-5 hover:bg-lime-400"
              onClick={() => {
                connect();
              }}
            >
              <Link className="w-6 h-4" />
            </Button>
          </div>
          <Separator />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={70} minSize={75} maxSize={80}>
          <div
            ref={termRef}
            className={cn("h-full bg-black ", termMode ? "block" : "hidden")}
          >
            {" "}
          </div>

          {!termMode && (
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={80} minSize={50} maxSize={85}>
                <ScrollArea className="h-full p-1">
                  {msgList.map((x, i) => (
                    <div className="p-1 text-xs  mb-[2px]" key={i}>
                      <code className="font-thin">{x.date}</code>
                      <span className="font-mono"> {x.content}</span>
                    </div>
                  ))}
                </ScrollArea>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={20} minSize={15} maxSize={50}>
                <div className="flex h-full gap-1 p-2">
                  <Textarea
                    onChange={(e) => setSendMsg(e.target.value)}
                  ></Textarea>
                  <Button onClick={() => send(sendMsg)}>Send</Button>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
