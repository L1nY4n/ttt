import { ScrollArea } from "@/components/ui/scroll-area";
import DeviceView from "./device";
export type Device = {
  ip: string;
  mac: BigInteger;
  name: string | null;
  date: Date;
  text: string;
  labels: string[];
  network: Network;
  tcp_server: TcpServer | null;
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

interface DeviceListProps {
  items: Device[];
}

export function DeviceList({ items }: DeviceListProps) {
  return (
    <ScrollArea className="h-screen">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {items.map((item) => {
          return (
            <DeviceView
              key={item.mac.toString()}
              info={item}
              onStatusChange={() => {}}
              onModeChange={() => {}}
            />
          );
        })}
      </div>
    </ScrollArea>
  );
}
