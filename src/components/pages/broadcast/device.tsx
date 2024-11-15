// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuGroup,
//   DropdownMenuItem,
//   DropdownMenuShortcut,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { differenceInMinutes } from "date-fns/differenceInMinutes";
import { invoke } from "@tauri-apps/api/core";
import { zhCN } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle2,

  Settings,
  Share2,
  TrainFront,

} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import { Separator } from "@radix-ui/react-separator";
import { Badge } from "@/components/ui/badge";
import { Device } from "./dev-list";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type DeviceViewProps = {
  info: Device;
  onStatusChange: (status: number) => void;
  onModeChange: (mode: number) => void;
};

function DeviceView({ info }: DeviceViewProps) {

  const StatusIcon = <TrainFront className="w-4 h-4 text-green-500" />;;

  const modeIcon = null;
  const [dhcp, setDhcp] = useState(info.network.dhcp);
  const [ipaddr, setIpAddr] = useState(info.network.ipaddr);
  const [gateway, setGateway] = useState(info.network.gateway);
  const [netmask, setNetmask] = useState(info.network.netmask);
  const [errors, setErrors] = useState({
    ipaddr: "",
    gateway: "",
    netmask: "",
  });

  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;

  const validateInput = (
    value: string,
    field: "ipaddr" | "gateway" | "netmask"
  ) => {
    if (!value) {
      setErrors((prev) => ({ ...prev, [field]: "This field is required" }));
      return false;
    }
    if (!ipRegex.test(value)) {
      setErrors((prev) => ({
        ...prev,
        [field]: "Invalid format. Use xxx.xxx.xxx.xxx",
      }));
      return false;
    }
    const parts = value.split(".").map(Number);
    if (parts.some((part) => part < 0 || part > 255)) {
      setErrors((prev) => ({
        ...prev,
        [field]: "Each octet must be between 0 and 255",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, [field]: "" }));
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isIpValid = validateInput(ipaddr, "ipaddr");
    const isGatewayValid = validateInput(gateway, "gateway");
    const isNetmaskValid = validateInput(netmask, "netmask");

    if (isIpValid && isGatewayValid && isNetmaskValid) {
      console.log("Form submitted:", { ipaddr, gateway, netmask });
      invoke("set_network", {mac: info.mac, network: {ipaddr, gateway, netmask}}).then(() => {
        console.log("设置成功");
      })
    }
  };

  return (
    <div className="relative p-2 text-sm text-left transition-all border rounded-lg w-60 hover:bg-accent">
      <div className="flex items-center gap-2 ">
        <Share2
          className={cn(
            "w-4 h-4",
            differenceInMinutes(new Date(), info.date) < 10
              ? "text-green-500"
              : "text-gray-300"
          )}
        />
        <div>{info.mac}</div>
        <div className="text-[75%] text-muted-foreground">
          {formatDistanceToNow(info.date, {
            locale: zhCN,
            addSuffix: true,
            includeSeconds: true,
          })}
        </div>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <button className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-center border rounded-[30%] bg-border ">
            <Settings className="w-4 h-4 text-slate-500" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="flex flex-col items-start gap-2 p-3 text-sm text-left transition-all border rounded-lg hover:bg-accent">
          <div className="flex flex-col w-full gap-1">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="font-semibold">
                  <Badge>{info.mac}</Badge>
                </div>

                {/* <DropdownMenu>
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
                </DropdownMenu> */}
              </div>
              <div
                className={cn(
                  "ml-auto text-xs",
                  false ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {formatDistanceToNow(info.date, {
                  locale: zhCN,
                  addSuffix: true,
                  includeSeconds: true,
                })}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded ">
            <div className="mb-1">
              <Label htmlFor="ipaddr">IP Address</Label>
              <Input
                className="h-8"
                id="ipaddr"
                type="text"
                placeholder="xxx.xxx.xxx.xxx"
                value={ipaddr}
                onChange={(e) => setIpAddr(e.target.value)}
                onBlur={() => validateInput(ipaddr, "ipaddr")}
              />
              {errors.ipaddr && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {errors.ipaddr}
                </p>
              )}
            </div>

            <div className="mb-1">
              <Label htmlFor="gateway">Gateway</Label>
              <Input
                className="h-8"
                id="gateway"
                type="text"
                placeholder="xxx.xxx.xxx.xxx"
                value={gateway}
                onChange={(e) => setGateway(e.target.value)}
                onBlur={() => validateInput(gateway, "gateway")}
              />
              {errors.gateway && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {errors.gateway}
                </p>
              )}
            </div>

            <div className="mb-4">
              <Label htmlFor="netmask">Netmask</Label>
              <Input
                className="h-8"
                id="netmask"
                type="text"
                placeholder="xxx.xxx.xxx.xxx"
                value={netmask}
                onChange={(e) => setNetmask(e.target.value)}
                onBlur={() => validateInput(netmask, "netmask")}
              />
              {errors.netmask && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {errors.netmask}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full h-8 ">
              Submit
            </Button>

            {!errors.ipaddr &&
              !errors.gateway &&
              !errors.netmask &&
              ipaddr &&
              gateway &&
              netmask && (
                <p className="flex items-center justify-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  All fields are valid
                </p>
              )}
          </form>
        </PopoverContent>
      </Popover>

      <div>
        <div>
          <div className="flex items-center justify-start cursor-pointer">
            {StatusIcon} {info.network.ipaddr}
            <Separator orientation="horizontal" />
            {modeIcon}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeviceView;
