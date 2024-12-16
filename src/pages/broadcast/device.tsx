import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { differenceInMinutes } from "date-fns/differenceInMinutes";
import { invoke } from "@tauri-apps/api/core";
import { zhCN } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle2,
  Power,
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
import { Device } from "./dev-list";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

type DeviceViewProps = {
  info: Device;
  onStatusChange: (status: number) => void;
  onModeChange: (mode: number) => void;
};

function DeviceView({ info }: DeviceViewProps) {
  const StatusIcon = <TrainFront className="w-4 h-4 text-green-500" />;

  const modeIcon = null;
  const [dhcp, setDhcp] = useState(info.network.dhcp);
  const [ipaddr, setIpAddr] = useState(info.network.ipaddr);
  const [gateway, setGateway] = useState(info.network.gateway);
  const [netmask, setNetmask] = useState(info.network.netmask);
  const [dns, setDns] = useState(info.network.dns);
  const [errors, setErrors] = useState({
    ipaddr: "",
    gateway: "",
    netmask: "",
    dns: "",
  });

  const [tcpserver_ip, setTcpserverIp] = useState(
    info.tcp_server?.ip || "192.168.0.2"
  );
  const [tcpserver_port, setTcpserverPort] = useState(
    info.tcp_server?.port || 6000
  );

  const [tcpserver_error, setTcpserverError] = useState({
    ipaddr: "",
    port: "",
  });

  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;

  const validateInput = (
    value: string,
    field: "ipaddr" | "gateway" | "netmask" | "dns"
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

  const validateTcpServerIp = (value: string) => {
    if (!value) {
      setTcpserverError((prev) => ({
        ...prev,
        ipaddr: "This field is required",
      }));
      return false;
    }
    if (!ipRegex.test(value)) {
      setTcpserverError((prev) => ({
        ...prev,
        ipaddr: "Invalid format. Use xxx.xxx.xxx.xxx",
      }));
      return false;
    }
    const parts = value.split(".").map(Number);
    if (parts.some((part) => part < 0 || part > 255)) {
      setTcpserverError((prev) => ({
        ...prev,
        ipaddr: "Each octet must be between 0 and 255",
      }));
      return false;
    }
    setTcpserverError((prev) => ({ ...prev, ipaddr: "" }));
    return true;
  };
  const validateTcpServerPort = (value: number) => {
    if (!value) {
      setTcpserverError((prev) => ({
        ...prev,
        port: "This field is required",
      }));
      return false;
    }
    if (value < 0 || value > 65535) {
      setTcpserverError((prev) => ({
        ...prev,
        port: "Port must be between 0 and 65535",
      }));
      return false;
    }

    setTcpserverError((prev) => ({ ...prev, port: "" }));
    return true;
  };

  const handleNetworkSetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isIpValid = validateInput(ipaddr, "ipaddr");
    const isGatewayValid = validateInput(gateway, "gateway");
    const isNetmaskValid = validateInput(netmask, "netmask");

    if (isIpValid && isGatewayValid && isNetmaskValid) {
      console.log("network_set:", { ipaddr, gateway, netmask });
      invoke("network_set", {
        mac: info.mac,
        network: { dhcp, ipaddr, gateway, netmask, dns },
      }).then(() => {
        toast.success("设置网络指令已发送", {
          description: "设置网络发送成功 " + "ip :" + info.ip,
        });
      });
    }
  };

  const handleTcpServerSetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isIpValid = validateTcpServerIp(tcpserver_ip);
    const isPortValid = validateTcpServerPort(tcpserver_port);

    if (isIpValid && isPortValid) {
      invoke("tcp_server_set", {
        mac: info.mac,
        tcpServer: { ip: tcpserver_ip, port: tcpserver_port },
      })
        .then(() => {
          toast.success("Done!", {
            description: "Tcp server Set " + "ip :" + info.ip,
          });
        })
        .catch((error) => {
          toast.error("Failed", {
            description: error,
          });
        });
    }
  };

  const reboot = () => {
    invoke("reboot", { mac: info.mac }).then(() => {
      toast.success("Done!", {
        description: "reboot " + "mac :" + info.ip,
      });
    });
  };

  return (
    <div className="relative w-64 p-2 text-sm text-left transition-all border rounded-lg hover:bg-accent">
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
        <PopoverContent className="relative p-3 text-sm text-left transition-all border rounded-lg hover:bg-accent max-w-[90%]">
          <Tabs defaultValue="ctr">
            <TabsList className="gap-1 ">
              <TabsTrigger value="ctr">Ctr</TabsTrigger>
              <TabsTrigger value="net">Net</TabsTrigger>
              <TabsTrigger value="sev">Sev</TabsTrigger>
            </TabsList>
            <TabsContent value="ctr">
              <Card className="w-full">
                <CardContent className="p-2">
                  <div className="w-max">
                    <Button variant="outline" onClick={reboot} className="">
                      <Power color="red" className="w-4 h-4 mr-2" /> Reboot
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="net">
              <Card>
                <CardContent className="space-y-2 ">
                  <form
                    onSubmit={handleNetworkSetSubmit}
                    className="pt-2 rounded"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Label htmlFor="dhcp">dhcp</Label>
                      <Switch
                        id="dhcp"
                        checked={dhcp === 1}
                        onCheckedChange={(c) => setDhcp(c ? 1 : 0)}
                      />
                    </div>
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

                    <div className="mb-1">
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

                    <div className="mb-4">
                      <Label htmlFor="dns">DNS</Label>
                      <Input
                        className="h-8"
                        id="dns"
                        type="text"
                        placeholder="xxx.xxx.xxx.xxx"
                        value={dns}
                        onChange={(e) => setDns(e.target.value)}
                        onBlur={() => validateInput(dns, "dns")}
                      />
                      {errors.dns && (
                        <p className="flex items-center gap-1 text-sm text-destructive">
                          <AlertCircle className="w-4 h-4" />
                          {errors.dns}
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
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="sev">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>TCP Servert Settings</CardTitle>
                  <CardDescription>Setting for tcp server</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <form
                    onSubmit={handleTcpServerSetSubmit}
                    className="rounded "
                  >
                    <div className="mb-1">
                      <Label htmlFor="ipaddr">IP Address</Label>
                      <Input
                        className="h-8"
                        id="ipaddr"
                        type="text"
                        placeholder="xxx.xxx.xxx.xxx"
                        value={tcpserver_ip}
                        onChange={(e) => setTcpserverIp(e.target.value)}
                        onBlur={() => validateTcpServerIp(tcpserver_ip)}
                      />
                      {tcpserver_error.ipaddr && (
                        <p className="flex items-center gap-1 text-sm text-destructive">
                          <AlertCircle className="w-4 h-4" />
                          {tcpserver_error.ipaddr}
                        </p>
                      )}
                    </div>

                    <div className="mb-4">
                      <Label htmlFor="dns">Port</Label>
                      <Input
                        className="h-8"
                        id="dns"
                        type="number"
                        step={1}
                        placeholder="0~65535"
                        value={tcpserver_port}
                        onChange={(e) =>
                          setTcpserverPort(parseInt(e.target.value))
                        }
                        onBlur={() => validateTcpServerPort(tcpserver_port)}
                      />
                      {tcpserver_error.port && (
                        <p className="flex items-center gap-1 text-sm text-destructive">
                          <AlertCircle className="w-4 h-4" />
                          {tcpserver_error.port}
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="w-full h-8 ">
                      Submit
                    </Button>

                    {!tcpserver_error.ipaddr && !tcpserver_error.port && (
                      <p className="flex items-center justify-center gap-1 text-sm text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        All fields are valid
                      </p>
                    )}
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
