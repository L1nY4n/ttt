import React, { useMemo, useRef, useState } from "react";
import { Line, Select, Html } from "@react-three/drei";
import { BeaconItem, LightItem } from "@/types";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export const Beacon: React.FC<
  BeaconItem & { nodes: LightItem[]; onClick: (selected: boolean) => void }
> = React.memo(({ id, position, rssi_map, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const currentPosition = useMemo(() => {
    return new THREE.Vector3(
      position ? position.x : 0,
      0.05,
      position ? position.z : 0
    );
  }, [position, rssi_map]);
  const [selected, setSelected] = useState(false);

  useFrame(() => {
    meshRef.current?.position.lerp(currentPosition, 0.01);
  });

  const toggleSelect = () => {
    setSelected(!selected);
    onClick(!selected);
  };
  return (
    <Select enabled={selected}>
      <group>
        <mesh
          ref={meshRef}
          position={currentPosition}
          onPointerUp={toggleSelect}
        >
          <boxGeometry args={[0.04, 0.1, 0.04]} />

          <meshStandardMaterial
            color={`#${id.toString(16)}`}
            emissive={`#${id.toString(16)}`}
            emissiveIntensity={0.3}
          />
          <Html position={[0, 0.1, 0]} center>
            <span className="text-xs text-white bg-transparent bg-black select-none whitespace-nowrap">
              {id.toString(16).toUpperCase()} ({currentPosition.x.toFixed(2)},
              {currentPosition.z.toFixed(2)})
            </span>
          </Html>
        </mesh>

        {selected &&
          position &&
          rssi_map &&
          Object.values(rssi_map).map(({ position: pos, rssi, distance }) => {
            const start = [
              currentPosition.x,
              currentPosition.y,
              currentPosition.z,
            ];
            const end = [pos.x, pos.y, pos.z];
            const rssi_tooltip = [
              (end[0] + start[0]) / 2,
              (end[1] + start[1]) / 2,
              (end[2] + start[2]) / 2,
            ];

            const real_distance = currentPosition.distanceTo(
              new THREE.Vector3(pos.x, pos.y, pos.z)
            );
            return (
              <>
                <Line
                  points={[start, end]}
                  color={`#${id.toString(16)}`}
                  dashed
                  dashSize={0.03}
                  gapSize={0.02}
                  linewidth={0.3}
                >
                  <lineDashedMaterial color={`#${id.toString(16)}`} />
                </Line>
                <mesh
                  position={rssi_tooltip as [x: number, y: number, z: number]}
                >
                  <Html center>
                    <div className="w-24 text-xs text-white translate-x-1 select-none ">
                      <div className="text-green-400"> {rssi} </div>
                      <div className="text-xs text-yellow-400">
                        ({real_distance.toFixed(2)} /{" "}
                        {(distance - real_distance).toFixed(2)})
                      </div>
                    </div>
                  </Html>
                </mesh>
              </>
            );
          })}
      </group>
    </Select>
  );
});
