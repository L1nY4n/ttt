export type Node = {
  id: string
  x: number
  y: number
  z: number
}

export type BeaconType = 'cargo' | 'person'

export type BeaconData = {
  id: string
  rssi: { [nodeId: string]: number }
  type: BeaconType
}

export type BeaconPosition = {
  id: string
  x: number
  y: number
  z: number
  type: BeaconType
}

export type WarehouseItemType = 'shelf' | 'aisle'

export type WarehouseItem = {
  id: string
  type: WarehouseItemType
  position: [number, number, number]
  size: [number, number, number]
  color: string
  movable: boolean
}

