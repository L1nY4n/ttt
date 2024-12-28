import React, { useRef, useState, useCallback } from "react";
import { Sphere, Html, SpotLight, Text } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Node } from "@/types";
import * as THREE from "three";

interface LightObjectProps extends Node {
  name: string;

  isSelected: boolean;
  isEditing: boolean;
}

export const LightObject: React.FC<LightObjectProps> = ({
  id,
  name,
  x,
  y,
  z,
  isSelected,
  isEditing,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const [dragging, setDragging] = useState(false);
  const { camera, raycaster, mouse } = useThree();

  const handlePointerMove = useCallback(
    (e: any) => {
      if (dragging && meshRef.current) {
        e.stopPropagation();
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        raycaster.setFromCamera(mouse, camera);
        const intersectionPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersectionPoint);
        meshRef.current.position.set(
          intersectionPoint.x,
          y,
          intersectionPoint.z
        );
      }
    },
    [dragging, y, raycaster, mouse, camera]
  );

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
        <boxGeometry args={[1, 1, 5]} />
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
      <mesh position={[x, y + 2, z]}>
        <Html center>
          <div className="text-sm text-white bg-transparent bg-black select-none whitespace-nowrap">
            {name}
          </div>
        </Html>
      </mesh>
    </group>
  );
};
