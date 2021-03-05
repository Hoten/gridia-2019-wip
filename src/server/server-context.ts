import * as path from 'path';
import { SECTOR_SIZE } from '../constants';
import Container, { ContainerType } from '../container';
import { Context } from '../context';
import * as fs from '../iso-fs';
import Player from '../player';
import * as Utils from '../utils';
import WorldMap from '../world-map';
import WorldMapPartition from '../world-map-partition';
import * as WireSerializer from '../lib/wire-serializer';
import Server from './server';

async function readJson(filePath: string) {
  const json = await fs.readFile(filePath);

  try {
    return JSON.parse(json);
  } catch (_) {
    throw new Error(`cannot parse json at ${filePath}: ${json}`);
  }
}

export class ServerContext extends Context {
  nextContainerId = 1;
  nextCreatureId = 1;
  nextPlayerId = 1;
  playerNamesToIds = new Map<string, number>();

  containerDir: string;
  playerDir: string;
  sectorDir: string;
  miscDir: string;

  constructor(map: WorldMap) {
    super(map);
    this.containerDir = 'containers';
    this.playerDir = 'players';
    this.sectorDir = 'sectors';
    this.miscDir = 'misc';
  }

  static async load() {
    const map = new WorldMap();
    const context = new ServerContext(map);
    const meta = await readJson(context.metaPath());

    // TODO: figure out if I want to save creatures at all.
    // const creatures = JSON.parse(await fs.readFile(context.creaturesPath()));
    // for (const creature of creatures) {
    //   context.creatures.set(creature.id, creature);
    //   // Purposefully do not set creature on tile, as that would load the sector.
    // }

    context.nextContainerId = meta.nextContainerId;
    context.nextCreatureId = meta.nextCreatureId;
    context.nextPlayerId = meta.nextPlayerId;

    // Just load all the partitions for now.
    const partitionIds = (await fs.readdir(context.sectorDir)).map(Number);
    for (const w of partitionIds) {
      const partitionPath = context.partitionMetaPath(w);
      const partitionMeta = await readJson(partitionPath);
      map.initPartition(w, partitionMeta.width, partitionMeta.height, partitionMeta.depth);
    }

    context.playerNamesToIds.clear();
    for (const playerPath of await fs.readdir(context.playerDir)) {
      if (playerPath.includes('password')) continue;

      const json = await fs.readFile(context.playerDir + '/' + playerPath);
      const player: Player = WireSerializer.deserialize(json);
      context.playerNamesToIds.set(player.name, player.id);
    }

    return context;
  }

  async loadSector(server: Server, sectorPoint: TilePoint) {
    const sector = await readJson(this.sectorPath(sectorPoint)) as Sector;

    // Set creatures (all of which are always loaded in memory) to the sector (of which only active areas are loaded).
    // Kinda lame, I guess.
    for (const creature of this.creatures.values()) {
      if (Utils.equalPoints(sectorPoint, Utils.worldToSector(creature.pos, SECTOR_SIZE))) {
        server.registerCreature(creature);
      }
    }

    return sector;
  }

  async saveSector(sectorPoint: TilePoint) {
    const sector = this.map.getSector(sectorPoint);
    // Don't save creatures.
    const data = sector.map((tiles) => tiles.map((tile) => ({ floor: tile.floor, item: tile.item })));
    const json = JSON.stringify(data, null, 2);
    await fs.writeFile(this.sectorPath(sectorPoint), json);
  }

  async savePlayerPassword(playerId: number, password: string) {
    // TODO salt n' pepper.
    await fs.writeFile(this.playerPasswordPath(playerId), password);
  }

  async checkPlayerPassword(playerId: number, password: string) {
    return await fs.readFile(this.playerPasswordPath(playerId)) === password;
  }

  async savePlayer(player: Player) {
    const json = WireSerializer.serialize(player);
    await fs.writeFile(this.playerPath(player.id), json);

    const container = this.containers.get(player.containerId);
    if (container) await this.saveContainer(container);

    const equipment = this.containers.get(player.equipmentContainerId);
    if (equipment) await this.saveContainer(equipment);
  }

  async loadPlayer(playerId: number): Promise<Player> {
    const json = await fs.readFile(this.playerPath(playerId));
    return WireSerializer.deserialize(json);
  }

  makeContainer(type: ContainerType, size = 30) {
    const container = new Container(type, this.nextContainerId++, Array(size).fill(null));
    this.containers.set(container.id, container);
    return container;
  }

  getContainerIdFromItem(item: Item) {
    if (item.containerId) {
      return item.containerId;
    } else {
      return item.containerId = this.makeContainer(ContainerType.Normal, 10).id;
    }
  }

  async saveContainer(container: Container) {
    const json = JSON.stringify({ type: container.type, items: container.items }, null, 2);
    await fs.writeFile(this.containerPath(container.id), json);
  }

  // TODO defer to loader like sector is?
  async getContainer(id: number) {
    let container = this.containers.get(id);
    if (container) return container;

    // TODO handle error.
    // (following todo may not be valid anymore)
    // TODO: even tho fs is stubbed in the browser build, parcel sees `readFileSync` and insists
    // that this be statically analyzable so it can do its bundling. Should create an interface that
    // doesn't trip up parcel's grepping for `.readFile`... (loadData?)
    const data = await readJson(this.containerPath(id)) as {
      type: ContainerType;
      items: Array<Item | null>;
    };
    container = new Container(data.type, id, data.items);
    this.containers.set(id, container);
    return container;
  }

  async save() {
    await fs.mkdir(this.containerDir, { recursive: true });
    await fs.mkdir(this.playerDir, { recursive: true });
    await fs.mkdir(this.sectorDir, { recursive: true });
    await fs.mkdir(this.miscDir, { recursive: true });

    await this.saveMeta();

    for (const [w, partition] of this.map.getPartitions()) {
      await this.savePartition(w, partition);
    }

    for (const container of this.containers.values()) {
      await this.saveContainer(container);
    }

    // TODO: figure out if I want to save creatures at all.
    // Player creatures are transient (new creature made for each login), so don't bother saving them.
    // const npcs = [...this.creatures.values()].filter((c) => !c.isPlayer);
    // await fs.writeFile(this.creaturesPath(), JSON.stringify(npcs, null, 2));
  }

  protected async saveMeta() {
    const meta = {
      nextContainerId: this.nextContainerId,
      nextCreatureId: this.nextCreatureId,
      nextPlayerId: this.nextPlayerId,
    };
    await fs.writeFile(this.metaPath(), JSON.stringify(meta, null, 2));
  }

  protected async savePartition(w: number, partition: WorldMapPartition) {
    await fs.mkdir(this.partitionPath(w), { recursive: true });

    const meta = {
      width: partition.width,
      height: partition.height,
      depth: partition.depth,
    };
    await fs.writeFile(this.partitionMetaPath(w), JSON.stringify(meta, null, 2));

    const promises = [];
    for (let sx = 0; sx < partition.sectors.length; sx++) {
      for (let sy = 0; sy < partition.sectors[0].length; sy++) {
        for (let sz = 0; sz < partition.sectors[0][0].length; sz++) {
          // Only save if the sector is loaded.
          // TODO: There's gotta be a nasty race condition here.
          if (partition.sectors[sx][sy][sz]) {
            promises.push(this.saveSector({ w, x: sx, y: sy, z: sz }));
          }
        }
      }
    }
    await Promise.all(promises);
  }

  protected metaPath() {
    return 'meta.json';
  }

  protected partitionPath(w: number) {
    return path.join(this.sectorDir, `${w}`);
  }

  protected partitionMetaPath(w: number) {
    return path.join(this.partitionPath(w), 'meta.json');
  }

  protected sectorPath(sectorPoint: TilePoint) {
    return path.join(this.partitionPath(sectorPoint.w), `${sectorPoint.x},${sectorPoint.y},${sectorPoint.z}.json`);
  }

  protected creaturesPath() {
    return 'creatures.json';
  }

  protected containerPath(id: number) {
    return path.join(this.containerDir, `${id}.json`);
  }

  protected playerPath(id: number) {
    return path.join(this.playerDir, `${id}.json`);
  }

  protected playerPasswordPath(id: number) {
    return path.join(this.playerDir, `${id}-password.json`);
  }
}
