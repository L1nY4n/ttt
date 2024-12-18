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
import {
  ArrowDownUp,
  BluetoothOff,
  Construction,
  Lightbulb,
  LightbulbOff,
  PersonStanding,
  Router,
  Settings,
  Settings2,
  TrainFront,
  Zap,
} from "lucide-react";
import { LightItem } from "./tree-view";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type LightViewProps = {
  info: LightItem;
  onStatusChange: (status: number) => void;
  onModeChange: (mode: number) => void;
};

function LightView({ info, onStatusChange, onModeChange }: LightViewProps) {
  const status_on = <Lightbulb className="w-4 h-4 text-orange-400" />;
  const status_off = <LightbulbOff className="w-4 h-4 text-gray-600" />;
  const status_flash = (
    <Zap className="w-4 h-4 text-purple-600 duration-150 animate-pulse" />
  );

  const mode_running = <TrainFront className="w-4 h-4 text-green-500" />;
  const mode_engineering = <Construction className="w-4 h-4 text-slate-600" />;
  const mode_induction = (
    <PersonStanding className="w-4 h-4 text-indigo-600 " />
  );

  const modeList = [
    { title: "Running", value: 1, icon: mode_running },
    { title: "Engineering", value: 2, icon: mode_engineering },
    { title: "Induction", value: 3, icon: mode_induction },
  ];
  const statusList = [
    { title: "On", value: 1, icon: status_on },
    { title: "Off", value: 0, icon: status_off },
    { title: "Flash", value: 2, icon: status_flash },
  ];

  const StatusIcon = info.data ? (
    info.data.status === 2 ? (
      status_flash
    ) : info.data.status === 1 ? (
      status_on
    ) : (
      status_off
    )
  ) : (
    <BluetoothOff className="w-4 h-4 text-red-600" />
  );

  const modeIcon = info.data
    ? info.data.mode === 1
      ? mode_running
      : info.data.mode === 2
        ? mode_engineering
        : mode_induction
    : null;
  return (
    <div className="relative   w-[240px]">
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
          <div className="font-bold">{info.addr.toString(16)}</div>
          <div className="text-[75%] text-muted-foreground">
            {formatDistanceToNow(info.date, {
              locale: zhCN,
              addSuffix: true,
              includeSeconds: true,
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
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
                      <Badge>{info.name}</Badge>
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
                      info.data?.status === 3
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
              <div className="text-xs line-clamp-2 text-muted-foreground">
                {info.name}
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={"outline"}>version: {info.data?.version?.toString(16)}</Badge>
              </div>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex p-0.5 rounded-sm bg-slate-200">
                {StatusIcon}
                <Separator orientation="vertical" />
                <Settings2 className="h-4" />
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
        </div>
      </div>

      <div>
        <div>
          <div className="flex items-center "></div>
        </div>
      </div>
      <div>
        {info.data?.beacon && (
          <div className="p-1 mt-1">
            <Separator />
            <div className="flex flex-wrap gap-1 min-h-4">
              {Object.entries(info.data.beacon)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="px-[3px] py-[2px] text-xs bg-slate-800 rounded-[5px]"
                  >
                    <span className="text-yellow-400"> {key} </span>
                    <sup className="text-green-300 "> {value.rssi}</sup>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LightView;
