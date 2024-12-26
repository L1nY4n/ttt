import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Beacon } from "./types";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { zhCN } from "date-fns/locale";

function copyToClipboard(key: string): void {
  navigator.clipboard.writeText(key);

  toast.success(`${key} Copied!`, {
    duration: 300,

    position: "top-right",
  });
}

export function BeaconView({ info }: { info: Beacon }) {
  return (
    <Badge className="px-[3px] py-[3px] text-xs  flex  items-center gap-1 w-21 justify-between cursor-pointer">
      <div className="  leading-[1.2rem]">
        <code
          onClick={(e) => {
            copyToClipboard(info.id.toString(16).toUpperCase());
            e.stopPropagation();
          }}
        >
          {" "}
          {info.id.toString(16).toUpperCase()}
        </code>
      </div>
      <div className="grid ">
        <div className=" text-green-400  text-[0.6rem]   leading-[0.6rem]">
          {" "}
          {info.battery}%
        </div>
      </div>
      <div>
        <Dialog modal={false}>
          <DialogTrigger asChild>
            <MapPin className="w-4 h-4 " />
          </DialogTrigger>
          <DialogContent className="]">
            <DialogHeader>
              <DialogTitle> {info.id.toString(16).toUpperCase()} </DialogTitle>
              <DialogDescription>rssi map of lights</DialogDescription>
            </DialogHeader>
            <div className="">
              {Object.entries(info.rssi_map).map(
                ([light_id, [point, rssi, date]]) => {
                  return (
                    <div className="flex items-center justify-around mb-1" key={light_id}>
                      <Badge className="text-right">
                        {parseInt(light_id).toString(16).toUpperCase()}
                        {`   [${point.x} , ${point.y} , ${point.z}]`}
                      </Badge>
                      <Badge className="text-xs ">{rssi}</Badge>
                      <Badge className="text-xs">
                        {date?.toLocaleString()} ----
                        {formatDistanceToNow(date, {
                          locale: zhCN,
                          addSuffix: true,
                          includeSeconds: true,
                        })}
                      </Badge>
                    </div>
                  );
                }
              )}
            </div>
            <DialogFooter></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Badge>
  );
}
