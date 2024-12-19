import { Node, BeaconData, BeaconPosition } from '../types'

export function calculateBeaconPosition(data: BeaconData, nodes: Node[]): BeaconPosition {
  // This is a simplified trilateration algorithm
  // In a real-world scenario, you'd use a more sophisticated algorithm

  let sumX = 0
  let sumY = 0
  let sumZ = 0
  let weightSum = 0

  nodes.forEach(node => {
    const rssi = data.rssi[node.id]
    if (rssi) {
      // Convert RSSI to distance (this is a very simplified conversion)
      const distance = Math.pow(10, (-69 - rssi) / (10 * 2))
      const weight = 1 / (distance * distance)

      sumX += node.x * weight
      sumY += node.y * weight
      sumZ += node.z * weight
      weightSum += weight
    }
  })

  return {
    id: data.id,
    x: sumX / weightSum,
    y: sumY / weightSum,
    z: sumZ / weightSum,
    type: data.type
  }
}

