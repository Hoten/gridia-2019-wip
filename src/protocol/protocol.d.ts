/*
  This is the source of truth for the protocol.
  Everything in gen/ is created by build-protocol.js
  The .ts files in this folder implement the files in gen/
*/

type Message = { id?: number; data: any };

interface Container_ {
  type: import('../container').ContainerType;
  id: number;
  items: Array<Item | null>;
}

type Command<P, R = void> = {
  params: P;
  // response: R extends void ? void : Promise<R>;
  response: R;
};

declare namespace Protocol {
  namespace Commands {
    type AdminSetFloor = Command<TilePoint & { floor: number }>;
    type AdminSetItem = Command<TilePoint & { item?: Item }>;
    type Chat = Command<{ to: string; message: string }>;
    type CloseContainer = Command<{ containerId: number }>;
    type CreatureAction = Command<{ creatureId: number; type: 'attack' | 'tame' | 'speak' }>;
    type DialogueResponse = Command<{ choiceIndex?: number }>;
    type Login = Command<{ name: string; password: string }>;
    type Logout = Command<{}>;
    type Move = Command<TilePoint>;
    type MoveItem = Command<{ from: ItemLocation; quantity?: number; to: ItemLocation }>;
    type Register = Command<{ name: string; password: string }>;
    type RequestContainer = Command<
      { containerId?: number; loc?: TilePoint; },
      { container: Container_ }
    >;
    type RequestCreature = Command<{ id: number }>;
    type RequestPartition = Command<{ w: number }>;
    type RequestSector = Command<TilePoint>;
    type Use = Command<{ toolIndex: number; location: ItemLocation; usageIndex?: number }>;
  }

  namespace Events {
    interface Animation extends TilePoint {
      key: string;
    }

    interface Container {
      container: Container_;
    }

    interface Initialize {
      player: import('../player').default;
      secondsPerWorldTick: number;
      ticksPerWorldDay: number;
      // quests: Array<{id: string, name: string, started: boolean}>;
    }

    interface InitializePartition extends TilePoint {
    }

    interface Log {
      msg: string;
    }

    interface RemoveCreature {
      id: number;
    }

    interface Sector extends TilePoint {
      tiles: Tile[][];
    }

    interface SetCreature extends Partial<Creature> {
      partial: boolean;
    }

    interface SetFloor extends TilePoint {
      floor: number;
    }

    interface SetItem {
      location: ItemLocation;
      item?: Item;
    }

    interface Xp {
      skill: number;
      xp: number;
    }

    interface Chat {
      from: string;
      to: string;
      message: string;
    }

    interface Time {
      epoch: number;
    }

    interface Dialogue {
      speaker?: string;
      text?: string;
      choices?: Array<any>;
    }
  }
}
