import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { differenceInMinutes } from "date-fns/differenceInMinutes";

import { zhCN } from "date-fns/locale";
import { ArrowDownUp, Router, Settings } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LightItem, Positon } from "./types";
import {
  mode_engineering,
  mode_induction,
  mode_running,
  modeList,
  status_flash,
  status_off,
  status_on,
  statusList,
} from "./const";
import { useState } from "react";


type LightViewProps = {
  info: LightItem;
  onStatusChange: (status: number) => void;
  onModeChange: (mode: number) => void;
  onUpdate: (name: string, position: Positon) => void;
};

function LightView({
  info,
  onStatusChange,
  onModeChange,
  onUpdate,
}: LightViewProps) {
  const [name, setName] = useState(info.name);
  const [position, setPosition] = useState(
    info.position || { x: 0, y: 0, z: 0 }
  );
  const StatusIcon =
    info.status === 2
      ? status_flash
      : info.status === 1
        ? status_on
        : status_off;

  const modeIcon =
    info.mode === 1
      ? mode_running
      : info.mode === 2
        ? mode_engineering
        : mode_induction;

  function onPositionChange(position: Positon) {
    setPosition(position);
    onUpdate(name, position);
  }

  function onNameChange(name: string) {
    setName(name);
    onUpdate(name, position);
  }

  return (
    <div className="relative w-64">
      <div className="flex items-center justify-between gap-2 p-1">
        <div className="flex items-center gap-2">
          <Router
            className={cn(
              "w-4 h-4",
              differenceInMinutes(new Date(), info.date) < 10
                ? "text-green-500"
                : "text-gray-300"
            )}
          />
          <div className="font-bold">
            <span>{info.addr.toString(16).toUpperCase()}</span>
            <sup className="text-xs text-orange-500">
              {info.version.toString(16)}
            </sup>
            <sub className="text-xs text-blue-500">
              {info.name}
            </sub>
          </div>
          <div className="text-[75%] text-muted-foreground">
            {formatDistanceToNow(info.date, {
              locale: zhCN,
              addSuffix: true,
              includeSeconds: true,
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex p-0.5 rounded-sm bg-slate-200">
                {StatusIcon}
                <Separator orientation="vertical" />
            
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                {statusList.map((item) => (
                  <DropdownMenuItem
                    key={item.value}
                    onClick={() => {
                      onStatusChange(item.value);
                    }}
                  >
                    {item.title}
                    <DropdownMenuShortcut>{item.icon}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Popover>
            <PopoverTrigger asChild>
              <button className=" inline-flex items-center justify-center w-5 h-5 text-center border rounded-[20%] bg-border ">
                <Settings className="w-4 h-4 text-slate-500" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col items-start gap-2 p-3 text-sm text-left transition-all border rounded-lg w-80 hover:bg-accent">
              <div className="flex flex-col w-full gap-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">
                      <Badge>{info.addr}</Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex p-1 rounded-sm bg-slate-200">
                          {modeIcon}
                          <Separator orientation="vertical" />
                          <ArrowDownUp className="h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuGroup>
                          {modeList.map((item) => (
                            <DropdownMenuItem
                              key={item.value}
                              onClick={() => {
                                onModeChange(item.value);
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
                  <div
                    className={cn(
                      "ml-auto text-xs",
                      info.status === 3
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatDistanceToNow(info.date, {
                      locale: zhCN,
                      addSuffix: true,
                      includeSeconds: true,
                    })}
                  </div>
                </div>
                <div className="text-xs font-medium">{info.name}</div>
              </div>
              <div className="flex items-center gap-1">
                <code className="font-semibold">Name:</code>
                <Input
                  type="text"
                  value={name}
                  className="w-1/3 h-7 "
                  onChange={(event) => {
                    onNameChange(event.target.value);
                  }}
                />
              </div>
              <div className="text-xs ">
                <code className="font-semibold">pos:</code>
                <div className="flex gap-1">
                  <div className="flex items-center gap-1">
                    X:{" "}
                    <Input
                      type="number"
                      value={position.x}
                      className="h-7 "
                      onChange={(event) => {
                        onPositionChange({
                          ...position,
                          x: parseFloat(event.target.value),
                        });
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    Y:
                    <Input
                      type="number"
                      value={position.y}
                      className="h-7 "
                      onChange={(event) => {
                        onPositionChange({
                          ...position,
                          y: parseFloat(event.target.value),
                        });
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    Z:{" "}
                    <Input
                      type="number"
                      value={position.z}
                      className="h-7"
                      onChange={(event) => {
                        onPositionChange({
                          ...position,
                          z: parseFloat(event.target.value),
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

export default LightView;
