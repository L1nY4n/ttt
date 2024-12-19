import React, { useRef, useMemo, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { BeaconPosition, Node } from '@/types'
import * as THREE from 'three'

const MOVEMENT_INTERVAL = 10000; // 10 seconds in milliseconds
const POSITION_UPDATE_CHANCE = 0.2; // 20% chance to update position every interval
const LERP_FACTOR = 0.05; // Smooth movement factor

export const Beacon: React.FC<BeaconPosition & { nodes: Node[] }> = React.memo(({ id, x, y, z, type, nodes }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const lineRef = useRef<THREE.Line>(null)
  const [targetPosition] = useState(() => new THREE.Vector3(x, 0.5, z))
  const currentPosition = useRef(new THREE.Vector3(x, 0.5, z))
  const lastUpdateTime = useRef(0)

  const nearestNode = useMemo(() => {
    return nodes.reduce((nearest, node) => {
      const distance = new THREE.Vector3(x, y, z).distanceTo(new THREE.Vector3(node.x, node.y, node.z))
      return distance < nearest.distance ? { node, distance } : nearest
    }, { node: null as Node | null, distance: Infinity })
  }, [nodes, x, y, z])

  const updatePosition = useCallback((time: number) => {
    if (time - lastUpdateTime.current > MOVEMENT_INTERVAL && Math.random() < POSITION_UPDATE_CHANCE) {
      targetPosition.set(
        Math.round(x + (Math.random() - 0.5) * 20),
        0.5,
        Math.round(z + (Math.random() - 0.5) * 20)
      )
      lastUpdateTime.current = time
    }
  }, [x, z, targetPosition])

  useFrame(({ clock }) => {
    updatePosition(clock.getElapsedTime() * 1000)
    currentPosition.current.lerp(targetPosition, LERP_FACTOR)
    if (meshRef.current) {
      meshRef.current.position.copy(currentPosition.current)
    }
    if (lineRef.current && nearestNode.node) {
      const geometry = lineRef.current.geometry as THREE.BufferGeometry
      const positions = geometry.attributes.position as THREE.BufferAttribute
      if (positions) {
        positions.setXYZ(0, currentPosition.current.x, currentPosition.current.y, currentPosition.current.z)
        positions.setXYZ(1, nearestNode.node.x, nearestNode.node.y, nearestNode.node.z)
        positions.needsUpdate = true
        geometry.computeBoundingSphere()
      }
    }
  })

  // const lineMaterial = useMemo(() => new THREE.LineDashedMaterial({
  //   color: 0x444444,
  //   dashSize: 1,
  //   gapSize: 1,
  // }), [])

  return (
    <group>
      <mesh ref={meshRef} position={[x, 0.5, z]}>
        {type === 'person' ? (
          <sphereGeometry args={[0.5, 16, 16]} />
        ) : (
          <boxGeometry args={[1, 1, 1]} />
        )}
        <meshStandardMaterial 
          color={type === 'person' ? '#0088ff' : '#ff8800'} 
          emissive={type === 'person' ? '#0088ff' : '#ff8800'}
          emissiveIntensity={0.3}
        />
      </mesh>
      <Html position={[0, 1.25, 0]} wrapperClass="htmlWrapper" center>
        <div className="px-2 py-1 text-xs text-black bg-white rounded whitespace-nowrap">
          {id} ({Math.round(currentPosition.current.x)}, {Math.round(currentPosition.current.y)}, {Math.round(currentPosition.current.z)})
        </div>
      </Html>
      {nearestNode.node && (
        <line ref={lineRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array(6)}
              itemSize={3}
            />
          </bufferGeometry>
          <lineDashedMaterial color="#444444" dashSize={1} gapSize={1} />
        </line>
      )}
    </group>
  )
})

