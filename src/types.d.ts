declare namespace NodeJS {
  interface Global {
    node: boolean;
  }
}

type Array2D<T> = T[][];
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

interface GridiaAccount {
  username: string;
  playerIds: string[];
}

interface Tile {
  floor: number;
  item?: Item; // Prefer undefined over null.
}

interface WorldLocation {
  source: 'world';
  loc: TilePoint;
}

interface ContainerLocation {
  source: 'container';
  id: string;
  index?: number;
}

// TODO: rename to Location
/** Either a world location or from a container. */
type ItemLocation = WorldLocation | ContainerLocation;

interface PossibleUsage {
  toolIndex: number;
  usageIndex: number;
  use: ItemUse;
  focusLocation: ItemLocation;
}

type Sector = Tile[][];

interface Item {
  type: number;
  quantity: number;
  growth?: number;
  containerId?: string;
  warpTo?: TilePoint;
}

interface Creature {
  id: number;
  dead: boolean;
  image: number;
  image_type?: number;
  imageData?: {
    arms: number;
    chest: number;
    head: number;
    legs: number;
    shield?: number;
    weapon?: number;
  };
  name: string;
  canSpeak?: boolean;
  pos: TilePoint;
  isPlayer: boolean;
  tamedBy?: string; // player id
  roam?: number;
  speed: number;
  life: number;
  food: number;
  eat_grass: boolean;
  light: number;
}

interface MetaFloor {
  id: number;
  color: string;
}

interface MetaItem {
  id: number;
  name: string;
  class: 'Normal' | 'Ore' | 'CaveDown' | 'CaveUp' | 'Container' | 'Ball' | 'Weapon' | 'Ammo' | 'Plant' | 'Shield';
  equipSlot?: 'Head' | 'Weapon' | 'Chest' | 'Shield' | 'Legs';
  equipImage?: number;
  animations: number[];
  burden: number;
  growthDelta: number;
  growthItem: number;
  imageHeight: number;
  moveable: boolean;
  light: number;
  blocksLight: boolean;
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
  successFloor?: number;
  products: Array<{ type: number; quantity: number }>;
  skill?: string;
  skillSuccessXp?: number;
}

interface Skill {
  id: number;
  name: string;
}

interface GridiaAnimation {
  name: string;
  frames: Array<{
    sprite: number;
    sound?: string;
  }>;
}

interface Monster {
  id: number;
  name: string;
  image: number;
  image_type?: number;
  speed: number;
  life: number;
  roam?: number;
  eat_grass: boolean;
}

interface Quest {
  id: string;
  name: string;
  stages: string[];
}

interface QuestState {
  stage: string;
  data: Object;
}

interface Dialogue {
  speakers: Creature[];
  parts: DialoguePart[];
  onFinish?: () => void;
}

interface DialoguePart {
  speaker: number;
  text: string;
  choices?: any[];
}

interface UIState {
  mouse: {
    x: number;
    y: number;
    tile?: TilePoint;
    downTile?: TilePoint;
    state: string;
  };
  selectedView: {
    location?: ItemLocation;
    creatureId?: number;
    actions: GameAction[];
  };
  elapsedFrames: number;
  containers: {
    [id: string]: {
      selectedIndex: number | null;
    };
  };
}

interface GameAction {
  type: string;
  innerText: string;
  title: string;
  extra?: any;
}

type GameActionCreator = (location: ItemLocation) => GameAction[] | GameAction | undefined;

// https://stackoverflow.com/a/49397693
type NoMethodKeys<T> = ({ [P in keyof T]: T[P] extends Function ? never : P })[keyof T];
type NoMethods<T> = Pick<T, NoMethodKeys<T>>;

interface ServerOptions {
  verbose: boolean;
}

interface CLIOptions extends ServerOptions {
  directoryPath: string;
  port: number;
  ssl?: {
    cert: string;
    key: string;
  };
}

interface ServerWorkerOpts extends ServerOptions {
  mapName: string;
  dummyDelay: number;
  useMapPreview?: boolean;
}

declare namespace PIXI {
  // const PIXISound: any;
  let OutlineFilter: typeof import('@pixi/filter-outline').OutlineFilter;
}

declare module 'js-bbcode-parser' {
  export default {parse: (text: string) => string};
}
