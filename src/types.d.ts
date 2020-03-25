declare namespace NodeJS {
  interface Global {
    node: boolean;
  }
}

type Array3D<T> = T[][][];

interface Point2 {
  x: number;
  y: number;
}

interface Point3 {
  x: number;
  y: number;
  z: number;
}

interface Point4 {
  w: number;
  x: number;
  y: number;
  z: number;
}

type ScreenPoint = Point2;
type PartitionPoint = Point3;
type TilePoint = Point4; // `w` is world index

interface Tile {
  floor: number;
  item?: Item; // Prefer undefined over null.
  creature?: Creature;
}

/** Either a world location or from a container. */
type ItemLocation = {
  source: 'world';
  loc: TilePoint;
} | {
  source: 'container';
  id: number;
  index?: number;
};

interface PossibleUsage {
  toolIndex: number;
  use: ItemUse;
  focusLocation: ItemLocation;
}

type Sector = Tile[][];

interface Item {
  type: number;
  quantity: number;
  growth?: number;
  containerId?: number;
  warpTo?: TilePoint;
}

interface Creature {
  id: number;
  image: number;
  name: string;
  pos: TilePoint;
  isPlayer: boolean;
  tamedBy?: number; // player id
  roam?: number;
  speed: number;
}

type ServerToClientMessage = import('./protocol/gen/server-to-client-protocol-builder').Message;
type ClientToServerMessage = import('./protocol/gen/client-to-server-protocol-builder').Message;

interface MetaItem {
  id: number;
  name: string;
  class: 'Normal' | 'Ore' | 'CaveDown' | 'CaveUp' | 'Container' | 'Ball';
  animations: number[];
  burden: number;
  growthDelta: number;
  growthItem: number;
  imageHeight: number;
  moveable: boolean;
  rarity: number;
  stackable: boolean;
  walkable: boolean;
  trapEffect: 'Warp';
}

interface ItemUse {
  animation?: string;
  successMessage: string;
  tool: number;
  focus: number;
  toolQuantityConsumed: number;
  focusQuantityConsumed: number;
  successTool?: number;
  products: Array<{ type: number, quantity: number }>;
  skill?: string;
  skillSuccessXp?: number;
}

interface Skill {
  id: number;
  name: string;
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
  speed: number;
  roam?: number;
}

interface UIState {
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  mouse: {
    x: number;
    y: number;
    tile?: TilePoint;
    downTile?: TilePoint;
    state: string;
  };
  selectedView: {
    tile?: TilePoint;
    creatureId?: number;
  };
  elapsedFrames: number;
}

interface GameAction {
  type: string;
  innerText: string;
  title: string;
}

type GameActionCreator = (tile: Tile, loc: TilePoint) => GameAction[] | GameAction | undefined;

// https://stackoverflow.com/a/49397693
type NoMethodKeys<T> = ({ [P in keyof T]: T[P] extends Function ? never : P })[keyof T];
type NoMethods<T> = Pick<T, NoMethodKeys<T>>;

interface ServerOptions {
  serverData: string;
  verbose: boolean;
}

interface CLIOptions extends ServerOptions {
  port: number;
  ssl?: {
    cert: string;
    key: string;
  };
}

interface ServerWorkerOpts extends ServerOptions {
  dummyDelay: number;
  useMapPreview?: boolean;
}

declare module 'pixi-scrollbox' {
  class Scrollbox {
    public content: PIXI.Container;
    constructor(...args: any[]);
    public update(): void;
  }
}

declare namespace PIXI {
  // const PIXISound: any;
  let Scrollbox: typeof import('pixi-scrollbox').Scrollbox;
  let OutlineFilter: typeof import('@pixi/filter-outline').OutlineFilter;
}
