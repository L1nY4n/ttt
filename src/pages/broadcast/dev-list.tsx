import { ScrollArea } from "@/components/ui/scroll-area";
import { Radar } from "lucide-react";
import DeviceView from "./device";
export type Device = {
  ip: string;
  mac: BigInteger;
  type?: number;
  name: string | null;
  date: Date;
  text: string;
  labels: string[];
  network: Network;
  tcp_server?: TcpServer | null;
  mqtt_config?: MqttConfig | null;
  status?: number;
};

export type Network = {
  dhcp: number;
  ipaddr: string;
  netmask: string;
  gateway: string;
  dns: string;
};

export type TcpServer = {
  ip: string;
  port: number;
};

export type MqttConfig = {
  ip: string;
  port: number;
  keepalive: number;
  subscribe_topic: string;
  username: string;
  password: string;
  client_id: string;
};

interface DeviceListProps {
  items: Device[];
}

export function DeviceList({ items }: DeviceListProps) {
  return (
    <ScrollArea className="h-full">
      {items.length === 0 ? (
        <div className="grid min-h-[18rem] place-items-center p-6">
          <div className="flex max-w-xs flex-col items-center gap-3 text-center">
            <Radar className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-medium">No devices found</p>
              <p className="text-xs text-muted-foreground">
                Waiting for UDP discovery responses
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-4">
          {items.map((item) => (
            <DeviceView
              key={item.mac.toString()}
              info={item}
              onStatusChange={() => {}}
              onModeChange={() => {}}
            />
          ))}
        </div>
      )}
    </ScrollArea>
  );
}
