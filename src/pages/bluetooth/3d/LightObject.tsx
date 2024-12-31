import React from "react";
import { Html } from "@react-three/drei";

interface LightObjectProps  {
  name: string;
  isSelected: boolean;
  x: number;
  y: number;
  z: number;
  isEditing: boolean;
}

export const LightObject: React.FC<LightObjectProps> = ({ name, x, y, z }) => {
  return (
    <group>
      {/* <Sphere
        ref={meshRef}
        args={[0.5, 32, 32]}
        position={[x, y, z]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={handlePointerDown}

        onPointerMove={handlePointerMove}
      >

      </Sphere> */}
      <mesh position={[x, y, z]}>
        <boxGeometry args={[0.1, 0.1, 0.4]} />
        <meshStandardMaterial color={"orange"} />
      </mesh>
      {/* <SpotLight
        position={[x, y, z]}
        angle={Math.PI / 1}
        penumbra={0.5}
        intensity={1}
        color="yellow"
        castShadow
        shadow-mapSize={[128, 128]}
      /> */}
      <mesh position={[x, y + 0.2, z]}>
        <Html center>
          <div className="text-sm text-white bg-transparent bg-black select-none whitespace-nowrap">
            {name}
          </div>
        </Html>
      </mesh>
    </group>
  );
};
