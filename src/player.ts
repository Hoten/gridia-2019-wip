import WorldMap from './world-map';
import { SECTOR_SIZE } from './constants';
import * as Utils from './utils';
import * as Content from './content';

interface TileSeenLogData {
  floor: number;
  walkable: boolean;
}

class TilesSeenLog {
  // w,x,y,z partition -> data
  public seen = new Map<string, Array2D<TileSeenLogData | null>>();

  public getSectorData(point: TilePoint) {
    const sectorPoint = Utils.worldToSector(point, SECTOR_SIZE);
    const key = `${point.w},${sectorPoint.x},${sectorPoint.y},${sectorPoint.z}`;
    let sector = this.seen.get(key);
    if (!sector) {
      sector = [];
      for (let x = 0; x < SECTOR_SIZE; x++) {
        sector[x] = [];
        for (let y = 0; y < SECTOR_SIZE; y++) {
          sector[x][y] = null;
        }
      }
      this.seen.set(key, sector);
    }

    return sector;
  }

  public markSeen(map: WorldMap, point: TilePoint) {
    const sector = this.getSectorData(point);
    const tile = map.getTile(point);
    const data = {
      floor: tile.floor,
      walkable: !tile.item || Content.getMetaItem(tile.item.type).walkable,
    };
    sector[point.x % SECTOR_SIZE][point.y % SECTOR_SIZE] = data;
  }

  public getMark(map: WorldMap, point: TilePoint) {
    const sector = this.getSectorData(point);
    return sector[point.x % SECTOR_SIZE][point.y % SECTOR_SIZE];
  }
}

function objToMap(obj: any) {
  const map = new Map();
  for (const [key, value] of Object.entries(obj || {})) {
    map.set(key, value);
  }
  return map;
}

export default class Player {
  public id = 0;
  public containerId = 0;
  public isAdmin = false;
  public name = '';
  // skill id -> xp
  public skills = new Map<number, number>();
  public tilesSeenLog = new TilesSeenLog();

  public constructor(public creature: Creature) { }

  public static fromJson(data: any) {
    const player = new Player(data.creature);

    for (const [key, value] of Object.entries(data)) {
      // @ts-ignore
      if (player[key] instanceof Object) continue;

      // @ts-ignore
      player[key] = value;
    }
    player.skills = objToMap(data.skills);
    player.tilesSeenLog.seen = objToMap(data.seen);

    return player;
  }

  public toSerializable() {
    return {
      ...this,
      skills: [...this.skills.entries()],
      tilesSeenLog: [...this.tilesSeenLog.seen.entries()],
    };
  }
}
