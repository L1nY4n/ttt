import React, { memo, useState, useMemo, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, Stars } from "@react-three/drei";
import { LightObject } from "./LightObject";
import { Beacon } from "./Beacon";
import { LightItem, BeaconItem } from "@/types";

import { Vector3 } from "three";

interface WarehouseSceneProps {
  lights: LightItem[];
  beacons: BeaconItem[];
}

const Floor = memo(() => {
  return (
    <>
      {/* <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[150, 150]} /> 
        <meshStandardMaterial color="#121212" />
      </mesh>  */}
      <Grid
        position={[50, 0, 50]}
        args={[100, 100]}
        cellSize={1}
        cellThickness={1}
        cellColor="#333"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#555"
        fadeDistance={400}
        fadeStrength={1}
      />
    </>
  );
});

const WallElement = memo(() => {
  return (
    <group>
      <mesh position={[-0.5, 2, 50]} castShadow receiveShadow>
        <boxGeometry args={[1, 4, 100]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      <mesh position={[50, 2, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[100, 4, 1]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
});

const BleSence: React.FC<WarehouseSceneProps> = memo(({ lights, beacons }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [lookat, setLookat] = useState([50.0, 0.0, 50.0]);

  const memoizedBeacons = useMemo(
    () =>
      beacons.map((beacon) => (
        <Beacon
          key={beacon.id}
          {...beacon}
          nodes={lights}
          onClick={(sel) => {
            if (sel) {
              const pos = beacon.position
                ? [beacon.position.x / 20, 0.5, beacon.position.z / 20]
                : [50.0, 0.0, 50.0];
              setLookat(pos);
            } else {
            }
          }}
        />
      )),
    [beacons, lights]
  );

  const memoizedNodes = useMemo(
    () =>
      lights
        .filter((l) => l.position)
        .map((node) => (
          <LightObject
            id={node.addr.toString()}
            x={node.position.x / 20}
            y={node.position.y / 20}
            z={node.position.z / 20}
            key={node.addr}
            {...node}
            name={node.name || node.addr.toString(16).toUpperCase()}
            isSelected={node.addr.toString() === selectedNodeId}
            isEditing={isEditMode}
          />
        )),
    [lights, selectedNodeId, isEditMode]
  );

  // const calculateCenter = () => {
  //   const box = new Box3();
  //   lights.forEach((l) => {
  //     let mesh = new Mesh(new BoxGeometry(1, 1, 1));
  //     mesh.position.set(l.position.x, l.position.y, l.position.z);
  //     box.expandByObject(mesh);
  //   });
  //   const center = box.getCenter(new Vector3());
  //   return center;
  // };

  function Rig() {
    const vec = new Vector3();
    let  lt =  new Vector3();
    return useFrame(({ camera }) => {
      camera.position.lerp(
        vec.set(camera.position.x, camera.position.y, camera.position.z),
        0.05
      );
      const [x, y, z] = lookat;
      if (lt.x !==x || lt.y !==y ||lt.z !==z) {
        camera.lookAt(x, y, z);
      }

    });
  }

  return (
    <div className="w-full h-full ">
      <header className="z-40">
        <br />
      </header>
      <Canvas camera={{ position: [100, 50, 50], fov: 60 }} shadows>
        <color attach="background" args={["#111"]} />
        <Environment preset="warehouse" />
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Floor />
        <WallElement />
        {memoizedNodes}
        {memoizedBeacons}

        <OrbitControls target={lookat} />

        <Rig />

        <Stars
          radius={300}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
        />
      </Canvas>
    </div>
  );
});

export default BleSence;
