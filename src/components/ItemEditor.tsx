import React, { useState } from 'react'
import { WarehouseItem } from '@/types'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

interface ItemEditorProps {
  item: WarehouseItem
  onItemChange: (item: WarehouseItem) => void
  onClose: () => void
  onDelete: (id: string) => void
}

export const ItemEditor: React.FC<ItemEditorProps> = ({ item, onItemChange, onClose, onDelete }) => {
  const [localItem, setLocalItem] = useState(item)

  const handleChange = (field: keyof WarehouseItem, value: any) => {
    setLocalItem(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onItemChange(localItem)
    onClose()
  }

  return (
    <div className="absolute max-w-xs p-4 bg-white rounded shadow bottom-2 right-2">
      <h3 className="mb-2 text-lg font-bold">编辑项目</h3>
      <div className="space-y-2">
        <Label className="flex items-center justify-between">
          <span>类型:</span>
          <select 
            value={localItem.type} 
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-1/2 px-2 py-1 text-sm border rounded"
          >
            <option value="shelf">货架</option>
            <option value="aisle">过道</option>
          </select>
        </Label>
        <Label className="flex items-center justify-between">
          <span>颜色:</span>
          <Input 
            type="color" 
            value={localItem.color} 
            onChange={(e) => handleChange('color', e.target.value)}
            className="w-1/2"
          />
        </Label>
        {['x', 'y', 'z'].map((axis, index) => (
          <Label key={axis} className="flex flex-col">
            <span className="mb-1 text-sm">尺寸 {axis.toUpperCase()}:</span>
            <Slider
              value={[localItem.size[index]]}
              onValueChange={(value) => {
                const newSize = [...localItem.size]
                newSize[index] = value[0]
                handleChange('size', newSize)
              }}
              min={1}
              max={50}
              step={1}
            />
            <span className="text-xs text-right">{localItem.size[index]}</span>
          </Label>
        ))}
        <Label className="flex items-center justify-between">
          <span>可移动:</span>
          <Switch
            checked={localItem.movable}
            onCheckedChange={(checked) => handleChange('movable', checked)}
          />
        </Label>
      </div>
      <div className="flex justify-between mt-4">
        <Button onClick={handleSave} size="sm" className="w-1/3">保存</Button>
        <Button onClick={onClose} size="sm" variant="outline" className="w-1/3">取消</Button>
        <Button onClick={() => onDelete(item.id)} size="sm" variant="destructive" className="w-1/3">删除</Button>
      </div>
    </div>
  )
}

