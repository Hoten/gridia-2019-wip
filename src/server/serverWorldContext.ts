import * as fsSync from 'fs';
import * as path from 'path';
import { SECTOR_SIZE } from '../constants';
import Container from '../container';
import { Context } from '../context';
import * as fs from '../iso-fs';
import { equalPoints, worldToSector } from '../utils';
import WorldMap from '../world-map';

export class ServerContext extends Context {
  public static async load(serverDir: string) {
    const meta = JSON.parse(await fs.readFile(path.join(serverDir, 'meta.json'), 'utf-8'));
    const map = new WorldMap(meta.width, meta.height, meta.depth);
    map.loader = (sectorPoint) => {
      return context.loadSector(sectorPoint);
    };
    const context = new ServerContext(map);
    context.setServerDir(serverDir);
    // TODO when to load containers? all at once here, or lazily as needed like sectors?

    const creatures = JSON.parse(await fs.readFile(context.creaturesPath(), 'utf-8'));
    for (const creature of creatures) {
      context.creatures.set(creature.id, creature);
      // Purposefully do not set creature on tile, as that would load the sector.
    }

    context.nextCreatureId = meta.nextCreatureId;
    context.nextContainerId = meta.nextContainerId;

    return context;
  }

  public nextContainerId = 1;
  public nextCreatureId = 1;

  public serverDir: string;
  public sectorDir: string;
  public containerDir: string;

  public setServerDir(serverDir: string) {
    this.serverDir = serverDir;
    this.sectorDir = path.join(serverDir, 'sectors');
    this.containerDir = path.join(serverDir, 'containers');
  }

  public loadSector(sectorPoint: TilePoint): Sector {
    const sector: Sector = JSON.parse(fsSync.readFileSync(this.sectorPath(sectorPoint), 'utf-8'));

    // Set creatures (all of which are always loaded in memory) to the sector (of which only active areas are loaded).
    // Kinda lame, I guess.
    for (const creature of this.creatures.values()) {
      if (equalPoints(sectorPoint, worldToSector(creature.pos, SECTOR_SIZE))) {
        sector[creature.pos.x % SECTOR_SIZE][creature.pos.y % SECTOR_SIZE].creature = creature;
      }
    }

    return sector;
  }

  public async saveSector(sectorPoint: TilePoint) {
    const sector = this.map.getSector(sectorPoint);
    // Don't save creatures.
    const data = sector.map((tiles) => tiles.map((tile) => {
      return {floor: tile.floor, item: tile.item};
    }));
    const json = JSON.stringify(data, null, 2);
    await fs.writeFile(this.sectorPath(sectorPoint), json);
  }

  public async save() {
    await fs.mkdir(this.sectorDir, {recursive: true});
    await fs.mkdir(this.containerDir, {recursive: true});

    const meta = {
      width: this.map.width,
      height: this.map.height,
      depth: this.map.depth,
      nextContainerId: this.nextContainerId,
      nextCreatureId: this.nextCreatureId,
    };
    await fs.writeFile(this.metaPath(), JSON.stringify(meta, null, 2));

    for (let sx = 0; sx < this.map.sectors.length; sx++) {
      for (let sy = 0; sy < this.map.sectors[0].length; sy++) {
        for (let sz = 0; sz < this.map.sectors[0][0].length; sz++) {
          await this.saveSector({x: sx, y: sy, z: sz});
        }
      }
    }

    for (const container of this.containers.values()) {
      const json = JSON.stringify(container.items, null, 2);
      await fs.writeFile(this.containerPath(container), json);
    }

    await fs.writeFile(this.creaturesPath(), JSON.stringify([...this.creatures.values()], null, 2));
  }

  protected metaPath() {
    return path.join(this.serverDir, 'meta.json');
  }

  protected creaturesPath() {
    return path.join(this.serverDir, 'creatures.json');
  }

  protected sectorPath(sectorPoint: TilePoint) {
    return path.join(this.sectorDir, `${sectorPoint.x},${sectorPoint.y},${sectorPoint.z}.json`);
  }

  protected containerPath(container: Container) {
    return path.join(this.containerDir, `${container.id}.json`);
  }
}
