import { ComponentProps } from "react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { atom, useAtom } from "jotai";

import { ScrollArea } from "@/components/ui/scroll-area";

import { Badge } from "@/components/ui/badge";
import DeviceView from "./device";

export type Device = {
  ip: string;
  mac: BigInteger;
  name: string | null;
  date: Date;
  text: string;
  labels: string[];
  network: Network;
};

export type Network = {
  ipaddr: string;
  netmask: string;
  gateway: string;
};

interface DeviceListProps {
  items: Device[];
}

type Config = {
  selected: Device["mac"] | null;
};

const configAtom = atom<Config>({
  selected: null,
});

export function DeviceList({ items }: DeviceListProps) {
  const [device, setDevice] = useAtom(configAtom);

  return (
    <ScrollArea className="h-screen">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {items.map((item) => {
          return (
            <DeviceView 
              key={item.mac.toString()}
              info={item} onStatusChange={()=>{} } onModeChange={()=>{} } />
          );
        })}
      </div>
    </ScrollArea>
  );
}

function getBadgeVariantFromLabel(
  label: string
): ComponentProps<typeof Badge>["variant"] {
  if (["work"].includes(label.toLowerCase())) {
    return "default";
  }

  if (["personal"].includes(label.toLowerCase())) {
    return "outline";
  }

  return "secondary";
}
