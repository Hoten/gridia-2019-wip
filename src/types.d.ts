interface TilePoint {
  x: number;
  y: number;
  z: number;
}

interface ScreenPoint {
  x: number;
  y: number;
}

interface Tile {
  floor: number;
  item?: Item; // Prefer undefined over null.
  creature?: Creature;
}

type Sector = Tile[][];

interface Item {
  type: number;
  quantity: number;
  growth?: number;
}

interface Creature {
  id: number;
  image: number;
  name: string;
  pos: TilePoint;
  isPlayer: boolean;
}

interface ProtocolDef<T> {
  // check?(context: P, args: T): boolean
  apply(context, args: T): void;
}

type WireMap = Record<string, (...args: any[]) => void>;

type WireMethod<P extends WireMap> =
  <T extends keyof P>(type: T, args: Parameters<P[T]>[1]) => void;

interface Wire<Input extends WireMap, Output extends WireMap> {
  receive: WireMethod<Input>;
  send: WireMethod<Output>;
}

type ServerToClientWire = Wire<
  typeof import('./protocol')['ClientToServerProtocol'],
  typeof import('./protocol')['ServerToClientProtocol']
>;

type ClientToServerWire = Wire<
  typeof import('./protocol')['ServerToClientProtocol'],
  typeof import('./protocol')['ClientToServerProtocol']
>;

interface MetaItem {
  id: number;
  name: string;
  class: 'Normal' | 'Ore' | 'CaveDown' | 'CaveUp';
  animations: number[];
  burden: number;
  growthDelta: number;
  growthItem: number;
  imageHeight: number;
  moveable: boolean;
  rarity: number;
  stackable: boolean;
  walkable: boolean;
}

interface ItemUse {
  animation?: string;
  successMessage: string;
  tool: number;
  focus: number;
  toolQuantityConsumed: number;
  focusQuantityConsumed: number;
  successTool?: number;
  products: number[];
  quantities: number[];
}

interface Animation {
  name: string;
  frames: Array<{
    sound: string;
  }>;
}

interface Monster {
  id: number;
  name: string;
  image: number;
}
