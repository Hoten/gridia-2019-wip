declare namespace NodeJS {
  interface Global {
    node: boolean;
  }
}

interface AddEventListenerOptions {
  signal?: AbortSignal;
}

declare namespace PIXI {
  export * from 'pixi.js';
}

// This is code split'd.
declare let PIXI: import('pixi.js');
declare let pixiSound: import('pixi-sound');
declare let OutlineFilter: import('@pixi/filter-outline');

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

type Region = Point4 & { width: number; height: number };

interface GridiaAccount {
  username: string;
  playerIds: string[];
}

interface Player {
  id: string;
  name: string;
  attributes: Map<string, { baseLevel: number; earnedLevel: number }>;
  skills: Map<number, { xp: number }>;
  skillPoints: number;
  containerId: string;
  equipmentContainerId: string;
  isAdmin: boolean;
  questStates: Map<string, QuestState>;
  tilesSeenLog: Map<string, Uint16Array>;
  loc: Point4;
  spawnLoc: Point4;
  life: number;
  stamina: number;
  mana: number;
  buffs: Buff[];
}

interface Container {
  id: string;
  type: 'normal' | 'equipment';
  items: Array<Item | null>;
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
  oreType?: number;
}

interface CreatureImageData {
  arms: { file: string; frames: number[] };
  chest: { file: string; frames: number[] };
  head: { file: string; frames: number[] };
  legs: { file: string; frames: number[] };
  shield?: { file: string; frames: number[] };
  weapon?: { file: string; frames: number[] };
}

interface Creature {
  id: number;
  // Refers to monster template id, if used.
  type?: number;
  dead: boolean;
  graphics: {
    file: string;
    index: number;
    // TODO
    imageType?: number;
  };
  imageData?: CreatureImageData;
  name: string;
  canSpeak?: boolean;
  pos: TilePoint;
  isPlayer: boolean;
  tamedBy?: string; // player id
  roam?: number;
  speed: number;
  life: { current: number; max: number };
  stamina: { current: number; max: number };
  mana: { current: number; max: number };
  food: number;
  eat_grass: boolean;
  light: number;
  equipment?: Array<Item | null>;
  combatLevel: number;
  stats: {
    armor: number;
    attackSpeed: number;
    damageLow: number;
    damageHigh: number;
    magicDefense: number;
    meleeDefense: number;
    missleDefense: number;
  };
  buffs: Buff[];
}

interface CreatureDescriptor {
  type: number;
  partial?: Partial<Creature>;
  onSpeak?: import('./server/creature-state').default['onSpeakCallback'];
}

interface Buff {
  id: string;
  /** UNIX epoch. */
  expiresAt: number;
  /** -1 is all */
  skill?: number;
  attribute?: string;
  linearChange?: number;
  percentChange?: number;
}

interface Graphics {
  file: string;
  frames: number[];
  imageHeight?: number;
}

interface MetaFloor {
  id: number;
  graphics: Graphics;
  color: string;
}

interface MetaItem {
  id: number;
  name: string;
  class:
  'Normal' | 'Armor' | 'Ore' | 'CaveDown' | 'CaveUp' | 'Container' |
  'Ball' | 'Weapon' | 'Ammo' | 'Plant' | 'Shield' | 'Wand';
  equipSlot?: 'Head' | 'Weapon' | 'Chest' | 'Shield' | 'Legs' | 'Ammo';
  equipImage?: Graphics;
  graphics: Graphics;
  burden: number;
  growthDelta?: number;
  growthItem?: number;
  moveable: boolean;
  light: number;
  blocksLight: boolean;
  rarity: number;
  stackable: boolean;
  walkable: boolean;
  trapEffect?: 'Warp';
  combatSkill?: number;
  armorLevel?: number;
  attackSpeed?: number;
  damageLow?: number;
  damageHigh?: number;
  ammoType?: number;
  minRange?: number;
  maxRange?: number;
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
  description: string;
  skillPoints: number;
  category: string;
  purpose: string;
  divisor: number;
  quickness?: number;
  dexterity?: number;
  strength?: number;
  intelligence?: number;
  wisdom?: number;
}

interface Spell {
  id: number;
  name: string;
  description: string;
  mana: number;
  skill: number;
  range: number;
  target: 'self' | 'other' | 'world';
  successXp: number;
  failureXp: number;
  life?: number;
  stamina?: number;
  variance?: number;
  animation?: number;
  projectileAnimation?: number;
  castTime: number;
  quickness?: number;
  dexterity?: number;
  strength?: number;
  intelligence?: number;
  wisdom?: number;
  hero?: number;
  spawnItems?: Item[];
  transformItemFrom?: Item;
  transformItemTo?: Item;
}

interface GridiaAnimation {
  name: string;
  frames: Array<{
    sprite: number;
    sound?: string;
  }>;
  directionalFrames?: boolean;
}

interface GridiaAnimationInstance {
  name: string;
  path: Point4[];
}

interface Monster {
  id: number;
  name: string;
  graphics: Creature['graphics'];
  speed: number;
  life: number;
  stamina?: number;
  mana?: number;
  magic_defense?: number;
  melee_defense?: number;
  missle_defense?: number;
  roam?: number;
  eat_grass: boolean;
  dead_item?: name;
  equipment?: Item[];
  treasure: Array<{
    item: string;
    quantity: number;
    /** 1 - 100 */
    chance: number;
  }>;
}

interface Quest {
  id: string;
  name: string;
  description: string;
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

declare module 'js-bbcode-parser' {
  export default { parse: (text: string) => string };
}
