import { useState, useEffect, useCallback } from "react";
import {
  BeaconData,
  BeaconPosition,
  BeaconType,
  WarehouseItem,
  BeaconItem,
  LightItem,
} from "@/types";

import BleSence from "./BleScene";


type Props = {
  lights: LightItem[];
  beacons: BeaconItem[];
};

export default function Ble3d({ lights,beacons }: Props) {



  return (
    <div className="relative w-full h-full">
      <BleSence
        lights={lights.filter((light) => light.position?.z !== 0)}
        beacons={beacons}
      />
     
    </div>
  );
}
