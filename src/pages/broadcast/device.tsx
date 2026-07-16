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
import { useEffect, useState } from "react";
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

  const [mqtt_ip, setMqttIp] = useState(
    info.mqtt_config?.ip || "192.168.0.2"
  );
  const [mqtt_port, setMqttPort] = useState(info.mqtt_config?.port || 1883);
  const [mqtt_keepalive, setMqttKeepalive] = useState(
    info.mqtt_config?.keepalive || 0
  );
  const [mqtt_subscribe_topic, setMqttSubscribeTopic] = useState(
    info.mqtt_config?.subscribe_topic || ""
  );
  const [mqtt_username, setMqttUsername] = useState(
    info.mqtt_config?.username || ""
  );
  const [mqtt_password, setMqttPassword] = useState(
    info.mqtt_config?.password || ""
  );
  const [mqtt_client_id, setMqttClientId] = useState(
    info.mqtt_config?.client_id || ""
  );

  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;

  useEffect(() => {
    setDhcp(info.network.dhcp);
    setIpAddr(info.network.ipaddr);
    setGateway(info.network.gateway);
    setNetmask(info.network.netmask);
    setDns(info.network.dns);
  }, [
    info.network.dhcp,
    info.network.ipaddr,
    info.network.gateway,
    info.network.netmask,
    info.network.dns,
  ]);

  useEffect(() => {
    if (info.tcp_server) {
      setTcpserverIp(info.tcp_server.ip);
      setTcpserverPort(info.tcp_server.port);
    }
  }, [info.tcp_server]);

  useEffect(() => {
    if (info.mqtt_config) {
      setMqttIp(info.mqtt_config.ip);
      setMqttPort(info.mqtt_config.port);
      setMqttKeepalive(info.mqtt_config.keepalive);
      setMqttSubscribeTopic(info.mqtt_config.subscribe_topic);
      setMqttUsername(info.mqtt_config.username);
      setMqttPassword(info.mqtt_config.password);
      setMqttClientId(info.mqtt_config.client_id);
    }
  }, [info.mqtt_config]);

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

  const validateMqttConfig = () => {
    const mqttIpParts = mqtt_ip.split(".").map(Number);
    if (
      !mqtt_ip ||
      !ipRegex.test(mqtt_ip) ||
      mqttIpParts.some((part) => part < 0 || part > 255)
    ) {
      toast.error("MQTT IP invalid");
      return false;
    }
    if (!mqtt_port || mqtt_port < 0 || mqtt_port > 65535) {
      toast.error("MQTT port must be between 0 and 65535");
      return false;
    }
    if (mqtt_keepalive < 0 || mqtt_keepalive > 65535) {
      toast.error("MQTT keepalive must be between 0 and 65535");
      return false;
    }
    const encoder = new TextEncoder();
    for (const [name, value] of [
      ["subscribe_topic", mqtt_subscribe_topic],
      ["username", mqtt_username],
      ["password", mqtt_password],
      ["client_id", mqtt_client_id],
    ] as const) {
      if (encoder.encode(value).length > 255) {
        toast.error(`${name} must be <= 255 bytes`);
        return false;
      }
    }
    return true;
  };

  const networkGet = () => {
    invoke("network_get", { mac: info.mac, targetIp: info.ip })
      .then(() => {
        toast.success("网络查询指令已发送", {
          description: "ip :" + info.ip,
        });
      })
      .catch((error) => {
        toast.error("网络查询失败", {
          description: error,
        });
      });
  };

  const handleNetworkSetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isIpValid = validateInput(ipaddr, "ipaddr");
    const isGatewayValid = validateInput(gateway, "gateway");
    const isNetmaskValid = validateInput(netmask, "netmask");
    const isDnsValid = validateInput(dns, "dns");

    if (isIpValid && isGatewayValid && isNetmaskValid && isDnsValid) {
      console.log("network_set:", { ipaddr, gateway, netmask });
      invoke("network_set", {
        mac: info.mac,
        targetIp: info.ip,
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
        targetIp: info.ip,
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

  const tcpServerGet = () => {
    invoke("tcp_server_get", { mac: info.mac, targetIp: info.ip })
      .then(() => {
        toast.success("TCP 服务查询指令已发送", {
          description: "ip :" + info.ip,
        });
      })
      .catch((error) => {
        toast.error("TCP 服务查询失败", {
          description: error,
        });
      });
  };

  const mqttConfigGet = () => {
    invoke("mqtt_config_get", { mac: info.mac, targetIp: info.ip })
      .then(() => {
        toast.success("MQTT 配置查询指令已发送", {
          description: "ip :" + info.ip,
        });
      })
      .catch((error) => {
        toast.error("MQTT 配置查询失败", {
          description: error,
        });
      });
  };

  const handleMqttConfigSetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMqttConfig()) {
      return;
    }
    invoke("mqtt_config_set", {
      mac: info.mac,
      targetIp: info.ip,
      mqttConfig: {
        ip: mqtt_ip,
        port: mqtt_port,
        keepalive: mqtt_keepalive,
        subscribe_topic: mqtt_subscribe_topic,
        username: mqtt_username,
        password: mqtt_password,
        client_id: mqtt_client_id,
      },
    })
      .then(() => {
        toast.success("MQTT 配置指令已发送", {
          description: "ip :" + info.ip,
        });
      })
      .catch((error) => {
        toast.error("MQTT 配置失败", {
          description: error,
        });
      });
  };

  const reboot = () => {
    invoke("reboot", { mac: info.mac, targetIp: info.ip }).then(() => {
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
              <TabsTrigger value="mqtt">MQTT</TabsTrigger>
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
                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8"
                      onClick={networkGet}
                    >
                      Query
                    </Button>
                  </div>
                  <form
                    onSubmit={handleNetworkSetSubmit}
                    className="rounded"
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
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8"
                      onClick={tcpServerGet}
                    >
                      Query
                    </Button>
                  </div>
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
            <TabsContent value="mqtt">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>MQTT Settings</CardTitle>
                  <CardDescription>Broker and device subscribe config</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8"
                      onClick={mqttConfigGet}
                    >
                      Query
                    </Button>
                  </div>
                  <form
                    onSubmit={handleMqttConfigSetSubmit}
                    className="space-y-2 rounded"
                  >
                    <div>
                      <Label htmlFor="mqtt_ip">Broker IP</Label>
                      <Input
                        className="h-8"
                        id="mqtt_ip"
                        type="text"
                        placeholder="xxx.xxx.xxx.xxx"
                        value={mqtt_ip}
                        onChange={(e) => setMqttIp(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="mqtt_port">Port</Label>
                        <Input
                          className="h-8"
                          id="mqtt_port"
                          type="number"
                          step={1}
                          min={0}
                          max={65535}
                          value={mqtt_port}
                          onChange={(e) =>
                            setMqttPort(parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="mqtt_keepalive">Keepalive</Label>
                        <Input
                          className="h-8"
                          id="mqtt_keepalive"
                          type="number"
                          step={1}
                          min={0}
                          max={65535}
                          value={mqtt_keepalive}
                          onChange={(e) =>
                            setMqttKeepalive(parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="mqtt_subscribe_topic">Subscribe Topic</Label>
                      <Input
                        className="h-8"
                        id="mqtt_subscribe_topic"
                        type="text"
                        value={mqtt_subscribe_topic}
                        onChange={(e) => setMqttSubscribeTopic(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="mqtt_username">Username</Label>
                      <Input
                        className="h-8"
                        id="mqtt_username"
                        type="text"
                        value={mqtt_username}
                        onChange={(e) => setMqttUsername(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="mqtt_password">Password</Label>
                      <Input
                        className="h-8"
                        id="mqtt_password"
                        type="password"
                        value={mqtt_password}
                        onChange={(e) => setMqttPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="mqtt_client_id">Client ID</Label>
                      <Input
                        className="h-8"
                        id="mqtt_client_id"
                        type="text"
                        value={mqtt_client_id}
                        onChange={(e) => setMqttClientId(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full h-8">
                      Submit
                    </Button>
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
