
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
