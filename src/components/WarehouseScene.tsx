import React, { memo, useState, useCallback, Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Stats, Grid, Preload } from '@react-three/drei'
import { Warehouse } from './Warehouse'
import { ReceiverNode } from './ReceiverNode'
import { Beacon } from './Beacon'
import { Node, BeaconPosition, WarehouseItem } from '../types'
import { EditModeControls } from './EditModeControls'
import { ItemEditor } from './ItemEditor'

interface WarehouseSceneProps {
  nodes: Node[]
  beacons: BeaconPosition[]
  onNodePositionChange: (id: string, x: number, y: number, z: number) => void
  warehouseItems: WarehouseItem[]
  onWarehouseItemsChange: (items: WarehouseItem[]) => void
}

const Floor = memo(() => {
  return (
    <>
      <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#e0e0e0" opacity={1} />
      </mesh>
      <Grid
        position={[0, 0, 0]}
        args={[100, 100]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#a0a0a0"
        sectionSize={25}
        sectionThickness={1}
        sectionColor="#808080"
        fadeDistance={100}
        fadeStrength={1}
      />
    </>
  )
})

const SimpleWarehouseElements = memo(() => {
  return (
    <group>
      {[[-20, 0, -20], [20, 0, -20], [-20, 0, 20], [20, 0, 20]].map((position, index) => (
        <mesh key={index} position={position} castShadow receiveShadow>
          <boxGeometry args={[10, 5, 10]} />
          <meshStandardMaterial color="#b0b0b0" />
        </mesh>
      ))}
      {[[-10, 0, 0], [10, 0, 0]].map((position, index) => (
        <group key={`shelf-${index}`} position={position}>
          {[0, 1, 2].map((level) => (
            <mesh key={`shelf-${index}-${level}`} position={[0, level * 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[8, 0.5, 20]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
})

const WarehouseScene: React.FC<WarehouseSceneProps> = memo(({ 
  nodes, 
  beacons, 
  onNodePositionChange, 
  warehouseItems,
  onWarehouseItemsChange
}) => {
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const handleItemChange = useCallback((updatedItem: WarehouseItem) => {
    onWarehouseItemsChange(warehouseItems.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ))
  }, [warehouseItems, onWarehouseItemsChange])

  const handleDeleteItem = useCallback((id: string) => {
    onWarehouseItemsChange(warehouseItems.filter(item => item.id !== id))
    setSelectedItemId(null)
  }, [warehouseItems, onWarehouseItemsChange])

  const memoizedBeacons = useMemo(() => beacons.map(beacon => (
    <Beacon key={beacon.id} {...beacon} nodes={nodes} />
  )), [beacons, nodes])

  const memoizedNodes = useMemo(() => nodes.map(node => (
    <ReceiverNode 
      key={node.id} 
      {...node} 
      onPositionChange={onNodePositionChange} 
      isSelected={node.id === selectedNodeId}
      isEditing={isEditMode}
    />
  )), [nodes, onNodePositionChange, selectedNodeId, isEditMode])

  const memoizedWarehouse = useMemo(() => (
    <Warehouse 
      items={warehouseItems} 
      isEditMode={isEditMode} 
      onItemsChange={onWarehouseItemsChange}
      selectedItemId={selectedItemId}
      setSelectedItemId={setSelectedItemId}
    />
  ), [warehouseItems, isEditMode, onWarehouseItemsChange, selectedItemId, setSelectedItemId])

  return (
    <div className="relative w-full h-screen">
      <Canvas camera={{ position: [0, 30, 70], fov: 60 }} shadows>
        <color attach="background" args={['#f5f5f5']} />
        <Environment preset="warehouse" />
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={0.8} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048}
        />
        <Suspense fallback={null}>
          <Floor />
          <SimpleWarehouseElements />
          {memoizedWarehouse}
          {memoizedNodes}
          {memoizedBeacons}
        </Suspense>
        <OrbitControls />
        <Preload all />
        <Stats />
      </Canvas>
      <EditModeControls 
        isEditMode={isEditMode} 
        setIsEditMode={setIsEditMode}
        selectedNodeId={selectedNodeId}
        setSelectedNodeId={setSelectedNodeId}
      />
      {isEditMode && selectedItemId && (
        <ItemEditor 
          item={warehouseItems.find(item => item.id === selectedItemId)!}
          onItemChange={handleItemChange}
          onClose={() => setSelectedItemId(null)}
          onDelete={handleDeleteItem}
        />
      )}
    </div>
  )
})

export default WarehouseScene

