import React, { useRef, useState, useCallback } from 'react'
import { Sphere, Html, SpotLight } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Node } from '@/types'
import * as THREE from 'three'

interface ReceiverNodeProps extends Node {
  onPositionChange: (id: string, x: number, y: number, z: number) => void
  isSelected: boolean
  isEditing: boolean
}

export const ReceiverNode: React.FC<ReceiverNodeProps> = ({ id, x, y, z, onPositionChange, isSelected, isEditing }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)
  const { camera, raycaster, mouse } = useThree()

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation()
    setDragging(true)
  }, [])

  const handlePointerUp = useCallback((e: any) => {
    e.stopPropagation()
    setDragging(false)
    if (meshRef.current) {
      const { x, y, z } = meshRef.current.position
      onPositionChange(id, x, y, z)
    }
  }, [id, onPositionChange])

  const handlePointerMove = useCallback((e: any) => {
    if (dragging && meshRef.current) {
      e.stopPropagation()
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      raycaster.setFromCamera(mouse, camera)
      const intersectionPoint = new THREE.Vector3()
      raycaster.ray.intersectPlane(plane, intersectionPoint)
      meshRef.current.position.set(intersectionPoint.x, y, intersectionPoint.z)
    }
  }, [dragging, y, raycaster, mouse, camera])

  return (
    <group>
      <Sphere
        ref={meshRef}
        args={[0.5, 32, 32]}
        position={[x, y, z]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        <meshStandardMaterial 
          color={hovered ? '#ff4400' : '#ff6600'} 
          emissive={hovered ? '#ff4400' : '#ff6600'} 
          emissiveIntensity={0.5} 
          roughness={0.3}
          metalness={0.7}
        />
      </Sphere>
      <SpotLight
        position={[x, y, z]}
        angle={Math.PI / 6}
        penumbra={0.5}
        intensity={0.5}
        color="#00ff00"
        castShadow
        shadow-mapSize={[512, 512]}
      />
      {(isSelected || isEditing) && (
        <Html position={[x, y + 1, z]}>
          <div className="px-2 py-1 text-xs text-black bg-white rounded shadow-md whitespace-nowrap">
            {id} ({x.toFixed(2)}, {y.toFixed(2)}, {z.toFixed(2)})
          </div>
        </Html>
      )}
    </group>
  )
}

