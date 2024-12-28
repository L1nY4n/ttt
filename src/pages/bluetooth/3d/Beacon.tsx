import React, { useRef, useState } from "react";
import { Line, Select, Html } from "@react-three/drei";
import { BeaconItem, LightItem } from "@/types";
import * as THREE from "three";

export const Beacon: React.FC<
  BeaconItem & { nodes: LightItem[]; onClick: (selected: boolean) => void }
> = React.memo(({ id, position, rssi_map, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const currentPosition = useRef(
    new THREE.Vector3(
      position ? position.x / 20 : 0,
      0.5,
      position ? position.z / 20 : 0
    )
  );
  const [selected, setSelected] = useState(false);

  const toggleSelect = () => {
    setSelected(!selected);
    onClick(!selected);
  };
  return (
    <Select enabled={selected}>
      <group>
        <mesh
          ref={meshRef}
          position={currentPosition.current}
          onPointerUp={toggleSelect}
        >
          <boxGeometry args={[0.6, 0.6, 0.6]} />

          <meshStandardMaterial
            color={`#${id.toString(16)}`}
            emissive={`#${id.toString(16)}`}
            emissiveIntensity={0.3}
          />
        </mesh>
        <mesh
          position={[
            currentPosition.current.x,
            currentPosition.current.y + 1,
            currentPosition.current.z,
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
                currentPosition.current.x,
                currentPosition.current.y,
                currentPosition.current.z,
              ];
              const end = [pos.x / 20, pos.y / 20, pos.z / 20];
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
                    dashSize={0.2}
                    gapSize={0.2}
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
                      <div className="text-xs text-white select-none">
                        {rssi}
                        <sup>dB</sup>
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
