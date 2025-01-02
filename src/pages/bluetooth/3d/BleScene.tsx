import React, { memo, useState, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Preload } from "@react-three/drei";
import { LightObject } from "./LightObject";
import { Beacon } from "./Beacon";
import { LightItem, BeaconItem } from "@/types";

import { Vector3 } from "three";
import { Loader2 } from "lucide-react";

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
        position={[7.5, 0, 7.5]}
        args={[15, 15]}
        cellSize={1}
        cellThickness={1}
        cellColor="#333"
        sectionSize={0.5}
        sectionThickness={1}
        sectionColor="#555"
        fadeDistance={400}
        fadeStrength={1}
      />
    </>
  );
});

const Wall = memo(() => {
  return (
    <group>
      <mesh position={[-0.05, 0.5, 7.5]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 1, 15]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      <mesh position={[7.5, 0.55, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[15, 1, 0.1]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
});

const BleSence: React.FC<WarehouseSceneProps> = memo(({ lights, beacons }) => {
  const [selectedNodeId, _setSelectedNodeId] = useState<string | null>(null);
  const [lookat, setLookat] = useState([5.0, 0.0, 5.0]);

  const memoizedBeacons = useMemo(() => {
    return beacons.map((beacon) => (
      <Beacon
        key={beacon.id}
        {...beacon}
        nodes={lights}
        onClick={(sel) => {
          if (sel) {
            const pos = beacon.position
              ? [beacon.position.x, 0.05, beacon.position.z]
              : [5.0, 0.0, 5.0];
            setLookat(pos);
          } else {
          }
        }}
      />
    ));
  }, [beacons, lights]);

  const memoizedNodes = useMemo(
    () =>
      lights
        .filter((l) => l.position)
        .map((node) => (
          <LightObject
            x={node.position.x}
            y={node.position.y}
            z={node.position.z}
            key={node.addr}
            {...node}
            name={node.name || node.addr.toString(16).toUpperCase()}
            isSelected={node.addr.toString() === selectedNodeId}
            isEditing={false}
          />
        )),
    [beacons, selectedNodeId]
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

    const { camera } = useThree();

    useEffect(() => {
      const [x, y, z] = lookat;
      camera.lookAt(x, y, z);
    }, [lookat]);

    useFrame(({ camera }) => {
      camera.position.lerp(
        vec.set(camera.position.x, camera.position.y, camera.position.z),
        0.05
      );
    });
    return null;
  }

  return (
    <div className="w-full h-full ">
      <header className="z-40">
        <br />
      </header>
      <Suspense fallback={<Loader2 size={64} className="animate-spin" />}>
        <Canvas
          camera={{ position: [10, 5, 5], fov: 60 }}
          shadows
          // frameloop="demand"
        >
          <color attach="background" args={["#111"]} />
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[1, 2, 1]}
            intensity={0.8}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <Floor />
          <Wall />
          {memoizedNodes}
          {memoizedBeacons}
          <OrbitControls target={lookat} />
          <Rig />
        
            <Preload all />
       
          </Canvas>
      </Suspense>
    </div>
  );
});

export default BleSence;
