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


export type State = {
  connected: boolean;
  gateway: { [key: string]: GatewayItem };
  light: { [key: string]: LightItem };
  beacon: { [key: string]: BeaconItem };
};

export type GatewayItem = {
  name: string;
  addr: number;
  ip?: string;
  model: string;
  version: number;
  isSelectable?: boolean;
  date: Date;
  data: {
    [key: string]: any;
  };
  children?: LightItem[];
};

export type LightItem = {
  name: string;
  addr: number;
  isSelectable?: boolean;
  gateway: string;
  date: Date;
  position: Positon;
  status: number;
  version: number;
  mode: number;
};

export type Positon = {
  x: number;
  y: number;
  z: number;
};

export type BeaconItem = {
  id: number;
  rssi: number;
  battery: number;
  date?: Date;
  rssi_map: {
    [key: number]: [Positon, number, Date];
  };
  position?: Positon;
};

export type DataProps = {
  status?: number;
  mode?: number;
  version?: number;
  beacon?: {
    [key: string]: {
      rssi: number;
      battery: number;
      date?: Date;
    };
  };
  [key: string]: any;
};


