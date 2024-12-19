import React, { useState, useRef } from 'react'
import { Box, Plane, Text } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { WarehouseItem } from '@/types'
import { useThree } from '@react-three/fiber'

interface WarehouseProps {
  items: WarehouseItem[]
  isEditMode: boolean
  onItemsChange: (items: WarehouseItem[]) => void
  selectedItemId: string | null
  setSelectedItemId: (id: string | null) => void
}

export const Warehouse: React.FC<WarehouseProps> = ({ 
  items, 
  isEditMode, 
  onItemsChange, 
  selectedItemId, 
  setSelectedItemId 
}) => {
  const warehouseSize = 100
  const [hoverPosition, setHoverPosition] = useState<[number, number, number] | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<[number, number, number] | null>(null)
  const { camera, raycaster, mouse } = useThree()

  const handlePlaneClick = (event: any) => {
    if (isEditMode && hoverPosition && !selectedItemId) {
      const newItem: WarehouseItem = {
        id: `item_${items.length + 1}`,
        type: 'shelf',
        position: hoverPosition,
        size: [8, 4, 20],
        color: '#8B4513',
        movable: true
      }
      onItemsChange([...items, newItem])
    }
  }

  const handlePlaneHover = (event: any) => {
    if (isEditMode && !selectedItemId) {
      const { point } = event
      setHoverPosition([
        Math.round(point.x / 5) * 5,
        0,
        Math.round(point.z / 5) * 5
      ])
    } else {
      setHoverPosition(null)
    }
  }

  const handleItemClick = (event: any, item: WarehouseItem) => {
    event.stopPropagation()
    if (isEditMode) {
      setSelectedItemId(item.id)
    }
  }

  const handleItemDragStart = (event: any, item: WarehouseItem) => {
    event.stopPropagation()
    if (isEditMode && item.movable) {
      setIsDragging(true)
      dragStart.current = item.position
    }
  }

  const handleItemDrag = (event: any) => {
    if (isDragging && dragStart.current) {
      const { point } = event
      const newPosition: [number, number, number] = [
        Math.round((point.x - dragStart.current[0]) / 5) * 5 + dragStart.current[0],
        dragStart.current[1],
        Math.round((point.z - dragStart.current[2]) / 5) * 5 + dragStart.current[2]
      ]
      onItemsChange(items.map(item => 
        item.id === selectedItemId ? { ...item, position: newPosition } : item
      ))
    }
  }

  const handleItemDragEnd = () => {
    setIsDragging(false)
    dragStart.current = null
  }

  const handleResize = (item: WarehouseItem, axis: 'x' | 'y' | 'z', delta: number) => {
    const newSize = [...item.size] as [number, number, number]
    const index = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    newSize[index] = Math.max(1, item.size[index] + delta)
    onItemsChange(items.map(i => 
      i.id === item.id ? { ...i, size: newSize } : i
    ))
  }

  return (
    <group>
      {items.map((item) => (
        <RigidBody key={item.id} type="fixed">
          <Box 
            args={item.size} 
            position={item.position}
            onClick={(e) => handleItemClick(e, item)}
            onPointerDown={(e) => handleItemDragStart(e, item)}
            onPointerMove={handleItemDrag}
            onPointerUp={handleItemDragEnd}
          >
            <meshStandardMaterial color={item.color} />
          </Box>
          {selectedItemId === item.id && (
            <>
              <Box 
                args={[0.5, 0.5, 0.5]} 
                position={[item.position[0] + item.size[0]/2, item.position[1] + item.size[1]/2, item.position[2]]}
                onClick={() => handleResize(item, 'x', 1)}
              >
                <meshBasicMaterial color="red" />
              </Box>
              <Box 
                args={[0.5, 0.5, 0.5]} 
                position={[item.position[0], item.position[1] + item.size[1], item.position[2]]}
                onClick={() => handleResize(item, 'y', 1)}
              >
                <meshBasicMaterial color="green" />
              </Box>
              <Box 
                args={[0.5, 0.5, 0.5]} 
                position={[item.position[0], item.position[1], item.position[2] + item.size[2]/2]}
                onClick={() => handleResize(item, 'z', 1)}
              >
                <meshBasicMaterial color="blue" />
              </Box>
            </>
          )}
        </RigidBody>
      ))}

      {isEditMode && hoverPosition && !selectedItemId && (
        <Box 
          args={[8, 4, 20]} 
          position={hoverPosition}
          material-color="#8B4513" 
          material-opacity={0.5} 
          material-transparent
        />
      )}

      {['A', 'B', 'C', 'D'].map((area, index) => (
        <Text
          key={area}
          position={[
            (index % 2 === 0 ? -1 : 1) * (warehouseSize / 4),
            0.1,
            (index < 2 ? -1 : 1) * (warehouseSize / 4)
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={5}
          color="black"
        >
          {`Area ${area}`}
        </Text>
      ))}

      <group>
        <Box args={[warehouseSize, 0.1, 0.1]} position={[0, 0.05, 0]}>
          <meshBasicMaterial color="red" />
        </Box>
        <Box args={[0.1, 0.1, warehouseSize]} position={[0, 0.05, 0]}>
          <meshBasicMaterial color="blue" />
        </Box>
      </group>
    </group>
  )
}

