import { ComponentProps } from "react"
//import formatDistanceToNow from "date-fns/formatDistanceToNow"

import { cn } from "@/lib/utils"

import { atom, useAtom } from "jotai"

import { ScrollArea } from "@radix-ui/react-scroll-area"
import { Badge } from "@/components/ui/badge"

export type Device = {
    ip: string
    mac: string 
    name: string |null  
    text: string,
    labels: string[],
    subject: string
}

interface DeviceListProps {
  items: Device[]
}

type Config = {
    selected: Device["mac"] | null
  }
  
  const configAtom = atom<Config>({
    selected: null,
  })
  

export function DeviceList({ items }: DeviceListProps) {
  const [device, setDevice] = useAtom(configAtom)

  return (
    <ScrollArea className="h-screen">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {items.map((item,i) => (
          <button
            key={i}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
              device.selected === item.mac && "bg-muted"
            )}
            onClick={() =>
              setDevice({
                ...device,
                selected: item.mac,
              })
            }
          >
            <div className="flex flex-col w-full gap-1">
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{item.ip}</div>
                  {!item.mac && (
                    <span className="flex w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </div>
                <div
                  className={cn(
                    "ml-auto text-xs",
                    device.selected === item.mac
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {/* {formatDistanceToNow(new Date(item.date), {
                    addSuffix: true,
                  })} */}
                </div>
              </div>
              <div className="text-xs font-medium">{item.subject}</div>
            </div>
            <div className="text-xs line-clamp-2 text-muted-foreground">
              {item.text.substring(0, 300)}
            </div>
            {item.labels.length ? (
              <div className="flex items-center gap-2">
                {item.labels.map((label) => (
                  <Badge key={label} variant={getBadgeVariantFromLabel(label)}>
                    {label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </ScrollArea>
  )
}

function getBadgeVariantFromLabel(
  label: string
): ComponentProps<typeof Badge>["variant"] {
  if (["work"].includes(label.toLowerCase())) {
    return "default"
  }

  if (["personal"].includes(label.toLowerCase())) {
    return "outline"
  }

  return "secondary"
}
