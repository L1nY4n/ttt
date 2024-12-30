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
      position ? position.z: 0
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
        </mesh>
        <mesh
          position={[
            currentPosition.x,
            currentPosition.y + 0.1,
            currentPosition.z,
          ]}
        >
          <Html center>
            <span className="text-[0.5rem] text-white bg-transparent bg-black select-none whitespace-nowrap">
              {id.toString(16).toUpperCase()}
            </span>
          </Html>
        </mesh>

        <group>
          {selected &&
            position &&
            rssi_map &&
            Object.values(rssi_map).map(([pos, rssi]) => {
              const start = [
                currentPosition.x,
                currentPosition.y,
                currentPosition.z,
              ];
              const end = [pos.x , pos.y, pos.z ];
              const rssi_tooltip = [
                (end[0] + start[0]) / 2,
                (end[1] + start[1]) / 2,
                (end[2] + start[2]) / 2,
              ];
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
                    {/* <Text fontSize={1} color="#fff" position={rssi_tooltip}>
                      {rssi}db
                    </Text> */}
                    <Html center>
                      <div className="text-xs text-white translate-x-1 select-none">
                        {rssi}
                        <sup className="text-green-400">dB</sup>
                      </div>
                    </Html>
                  </mesh>
                </>
              );
            })}
        </group>
      </group>
    </Select>
  );
});
