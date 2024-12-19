import React, { useState, memo } from 'react'
import { Node } from '@/types'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronUp } from 'lucide-react'

interface NodePanelProps {
  nodes: Node[]
  onPositionChange: (id: string, x: number, y: number, z: number) => void
}

const NodePanel: React.FC<NodePanelProps> = ({ nodes, onPositionChange }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const handleNodeSelect = (id: string) => {
    setSelectedNode(id === selectedNode ? null : id)
  }

  return (
    <div className="absolute max-w-xs bg-white rounded shadow top-2 left-2">
      <Button
        variant="ghost"
        className="flex items-center justify-between w-full p-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>接收点位置</span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </Button>
      {isExpanded && (
        <div className="p-2 max-h-[calc(100vh-6rem)] overflow-y-auto">
          {nodes.map(node => (
            <div key={node.id} className="mb-2">
              <Button
                variant="outline"
                className="w-full py-1 mb-2 text-sm"
                onClick={() => handleNodeSelect(node.id)}
              >
                节点 {node.id}
              </Button>
              {selectedNode === node.id && (
                <div className="grid grid-cols-3 gap-1">
                  {['x', 'y', 'z'].map((axis, index) => (
                    <Label key={axis} className="flex flex-col">
                      <span className="mb-1 text-xs">{axis.toUpperCase()}:</span>
                      <Input 
                        type="number" 
                        value={node[axis as keyof typeof node]} 
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value);
                          onPositionChange(
                            node.id,
                            axis === 'x' ? newValue : node.x,
                            axis === 'y' ? newValue : node.y,
                            axis === 'z' ? newValue : node.z
                          );
                        }}
                        className="w-full py-1 text-sm"
                      />
                    </Label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default memo(NodePanel)

