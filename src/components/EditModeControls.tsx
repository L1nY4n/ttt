import React from 'react'
import { Button } from "@/components/ui/button"

interface EditModeControlsProps {
  isEditMode: boolean
  setIsEditMode: (isEditMode: boolean) => void
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
}

export const EditModeControls: React.FC<EditModeControlsProps> = ({ 
  isEditMode, 
  setIsEditMode, 
  selectedNodeId, 
  setSelectedNodeId 
}) => {
  return (
    <div className="absolute top-2 right-2 flex flex-col gap-2">
      <Button
        onClick={() => setIsEditMode(!isEditMode)}
        variant={isEditMode ? "destructive" : "default"}
      >
        {isEditMode ? "退出编辑模式" : "进入编辑模式"}
      </Button>
      {isEditMode && (
        <Button
          onClick={() => setSelectedNodeId(selectedNodeId ? null : 'A')}
          variant={selectedNodeId ? "secondary" : "outline"}
        >
          {selectedNodeId ? `取消选择节点 ${selectedNodeId}` : "选择节点"}
        </Button>
      )}
    </div>
  )
}

