export type WarehouseItemType = "shelf" | "aisle";

export type WarehouseItem = {
  id: string;
  type: WarehouseItemType;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  movable: boolean;
};

export type State = {
  connected: boolean;
  gateway: { [key: string]: GatewayItem };
  light: { [key: string]: LightItem };
  beacon: { [key: string]: BeaconItem };
};

export type GatewayItem = {
  id: string;
  name: string;
  mac: string;
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
  id: string;
  name: string;
  addr: number;
  mac: string;
  isSelectable?: boolean;
  gateway: string;
  date: Date;
  position: Positon;
  status: number;
  version: number;
  mode: number;
  model: string;
  data: {};
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
    [key: number]: RssiItem;
  };
  position?: Positon;
};

export type RssiItem = {
  position: Positon;
  rssi: number;
  battery: number;
  date: Date;
  distance: number;
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
