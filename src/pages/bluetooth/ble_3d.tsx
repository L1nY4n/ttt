import  { useState, useEffect, useCallback } from "react";
import {
  Node,
  BeaconData,
  BeaconPosition,
  BeaconType,
  WarehouseItem,
} from "@/types";
import { calculateBeaconPosition } from "@/utils/trilateration";


import WarehouseScene from "@/components/WarehouseScene";

import NodePanel from "@/components/NodePanel";

export default function Ble3d() {
  const [nodes, setNodes] = useState<Node[]>([
    { id: "A", x: -40, y: 10, z: -40 },
    { id: "B", x: 40, y: 10, z: -40 },
    { id: "C", x: 0, y: 10, z: 40 },
    { id: "D", x: -40, y: 10, z: 40 },
    { id: "E", x: 40, y: 10, z: 40 },
  ]);
  const [beacons, setBeacons] = useState<BeaconPosition[]>([]);
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);

  const handleBeaconData = useCallback(
    (data: BeaconData) => {
      const position = calculateBeaconPosition(data, nodes);
      setBeacons((prev) => {
        const index = prev.findIndex((b) => b.id === data.id);
        if (index !== -1) {
          const newBeacons = [...prev];
          newBeacons[index] = { ...position, type: data.type };
          return newBeacons;
        }
        return [...prev, { ...position, type: data.type }];
      });
    },
    [nodes]
  );

  const handleNodePositionChange = useCallback(
    (id: string, x: number, y: number, z: number) => {
      setNodes((prev) =>
        prev.map((node) => (node.id === id ? { ...node, x, y, z } : node))
      );
    },
    []
  );

  const handleWarehouseItemsChange = useCallback((items: WarehouseItem[]) => {
    setWarehouseItems(items);
  }, []);

  const generateMockData = useCallback(() => {
    const totalBeacons = 10;
    const personCount = 5;
    const cargoCount = totalBeacons - personCount;
    const updatedBeacons: BeaconData[] = [];

    for (let i = 1; i <= totalBeacons; i++) {
      const beaconId = `Beacon${i}`;
      const rssi: { [nodeId: string]: number } = {};
      const type: BeaconType = i <= personCount ? "person" : "cargo";

      const existingBeacon = beacons.find((b) => b.id === beaconId);
      let x, y, z;

      if (type === "person") {
        const aisleIndex = Math.floor(Math.random() * 11) - 5;
        x = aisleIndex * 10;
        y = 0.5;
        z = existingBeacon
          ? existingBeacon.z + (Math.random() - 0.5) * 2
          : Math.random() * 80 - 40;
      } else {
        x = Math.floor(Math.random() * 11 - 5) * 10;
        y = 0.5;
        z = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 30 + 10);
      }

      x = Math.max(-49, Math.min(49, x));
      z = Math.max(-49, Math.min(49, z));

      nodes.forEach((node) => {
        const distance = Math.sqrt(
          Math.pow(x - node.x, 2) +
            Math.pow(y - node.y, 2) +
            Math.pow(z - node.z, 2)
        );
        rssi[node.id] = Math.floor(-20 * Math.log10(distance) - 41);
      });

      updatedBeacons.push({ id: beaconId, rssi, type });
    }

    updatedBeacons.forEach(handleBeaconData);
  }, [beacons, nodes, handleBeaconData]);

  useEffect(() => {
    const interval = setInterval(generateMockData, 1000);
    return () => clearInterval(interval);
  }, [generateMockData]);

  return (
    <div className="relative w-full h-screen">
      <WarehouseScene
        nodes={nodes}
        beacons={beacons}
        onNodePositionChange={handleNodePositionChange}
        warehouseItems={warehouseItems}
        onWarehouseItemsChange={handleWarehouseItemsChange}
      />
      <NodePanel nodes={nodes} onPositionChange={handleNodePositionChange} />
    </div>
  );
}
