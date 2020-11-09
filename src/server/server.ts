import { SECTOR_SIZE } from '../constants';
import * as Content from '../content';
import performance from '../performance';
import Player from '../player';
import ClientToServerProtocol from '../protocol/client-to-server-protocol';
import * as ProtocolBuilder from '../protocol/server-to-client-protocol-builder';
import * as Utils from '../utils';
import WorldMapPartition from '../world-map-partition';
import ClientConnection from './client-connection';
import CreatureState from './creature-state';
import { ServerContext } from './server-context';
import TaskRunner from './task-runner';

// TODO document how the f this works.

interface CtorOpts {
  context: ServerContext;
  verbose: boolean;
}

interface RegisterOpts {
  name: string;
  // password: string;
}

export default class Server {
  public context: ServerContext;
  public clientConnections: ClientConnection[] = [];
  public outboundMessages = [] as Array<{
    message: ServerToClientMessage,
    to?: ClientConnection,
    filter?: (client: ClientConnection) => boolean,
  }>;
  // @ts-ignore: this is always defined when accessed.
  public currentClientConnection: ClientConnection;
  public creatureStates: Record<number, CreatureState> = {};
  public players = new Map<number, Player>();
  public verbose: boolean;
  public taskRunner = new TaskRunner(50);

  private _clientToServerProtocol = new ClientToServerProtocol();

  constructor(opts: CtorOpts) {
    this.context = opts.context;
    this.verbose = opts.verbose;
    this.setupTickSections();
  }

  public reply(message: ServerToClientMessage) {
    this.outboundMessages.push({ to: this.currentClientConnection, message });
  }

  public broadcast(message: ServerToClientMessage) {
    this.outboundMessages.push({ message });
  }

  public send(message: ServerToClientMessage, toClient: ClientConnection) {
    this.outboundMessages.push({ to: toClient, message });
  }

  public conditionalBroadcast(message: ServerToClientMessage, filter: (client: ClientConnection) => boolean) {
    this.outboundMessages.push({ filter, message });
  }

  public start() {
    this.taskRunner.start();
  }

  public stop() {
    this.taskRunner.stop();
  }

  public async tick() {
    await this.taskRunner.tick();
  }

  public async save() {
    for (const clientConnection of this.clientConnections) {
      if (clientConnection.player) {
        await this.context.savePlayer(clientConnection.player);
      }
    }
    await this.context.save();
  }

  public async registerPlayer(clientConnection: ClientConnection, opts: RegisterOpts) {
    const { width, height } = this.context.map.getPartition(0);

    const center = { w: 0, x: Math.round(width / 2), y: Math.round(height / 2) + 3, z: 0 };
    // Make sure sector is loaded. Prevents hidden creature (race condition, happens often in worker).
    await this.ensureSectorLoadedForPoint(center);
    const spawnLoc = this.findNearest(center, 10, true, (_, loc) => this.context.map.walkable(loc)) || center;
    await this.ensureSectorLoadedForPoint(spawnLoc);

    const creature = this.registerCreature({
      id: this.context.nextCreatureId++,
      name: opts.name,
      pos: spawnLoc,
      image: Utils.randInt(0, 10),
      isPlayer: true,
      speed: 2,
      life: 1000,
      food: 100,
      eat_grass: false,
    });

    const player = new Player(creature);
    player.name = opts.name;
    player.isAdmin = true; // everyone is an admin, for now.

    player.id = this.context.nextPlayerId++;
    player.creature = creature;

    // Mock xp for now.
    for (const skill of Content.getSkills()) {
      player.skills.set(skill.id, 1);
    }

    clientConnection.container = this.context.makeContainer();
    if (opts.name !== 'test-user') {
      clientConnection.container.items[0] = { type: Content.getMetaItemByName('Wood Axe').id, quantity: 1 };
      clientConnection.container.items[1] = { type: Content.getMetaItemByName('Fire Starter').id, quantity: 1 };
      clientConnection.container.items[2] = { type: Content.getMetaItemByName('Pick').id, quantity: 1 };
      clientConnection.container.items[3] = { type: Content.getMetaItemByName('Plough').id, quantity: 1 };
      clientConnection.container.items[4] = { type: Content.getMetaItemByName('Mana Plant Seeds').id, quantity: 100 };
      clientConnection.container.items[5] = { type: Content.getMetaItemByName('Soccer Ball').id, quantity: 1 };
      clientConnection.container.items[6] = { type: Content.getMetaItemByName('Saw').id, quantity: 1 };
      clientConnection.container.items[7] = { type: Content.getMetaItemByName('Hammer and Nails').id, quantity: 1 };
    }

    this.players.set(player.id, player);
    clientConnection.player = player;
    // Don't bother waiting.
    this.context.savePlayer(clientConnection.player);
    await this.initClient(clientConnection);
  }

  public removeClient(clientConnection: ClientConnection) {
    this.clientConnections.splice(this.clientConnections.indexOf(clientConnection), 1);
    if (clientConnection.player) {
      this.removeCreature(clientConnection.player.creature);
      this.broadcast(ProtocolBuilder.animation({
        ...clientConnection.player.creature.pos,
        key: 'WarpOut',
      }));
    }
  }

  public async consumeAllMessages() {
    while (this.clientConnections.some((c) => c.hasMessage()) || this.outboundMessages.length) {
      await this.tick();
    }
  }

  public makeCreatureFromTemplate(creatureType: number | Monster, pos: TilePoint) {
    const template = typeof creatureType === 'number' ? Content.getMonsterTemplate(creatureType) : creatureType;
    if (!template) return; // TODO

    const creature = {
      id: this.context.nextCreatureId++,
      image: template.image,
      image_type: template.image_type,
      name: template.name,
      pos,
      isPlayer: false,
      roam: template.roam,
      speed: template.speed,
      life: template.life,
      food: 10,
      eat_grass: template.eat_grass,
    };

    this.registerCreature(creature);
    return creature;
  }

  public registerCreature(creature: Creature): Creature {
    this.creatureStates[creature.id] = new CreatureState(creature);
    this.context.setCreature(creature);
    this.broadcast(ProtocolBuilder.setCreature({ partial: false, ...creature }));
    return creature;
  }

  public moveCreature(creature: Creature, pos: TilePoint | null) {
    delete this.context.map.getTile(creature.pos).creature;
    if (pos) {
      creature.pos = pos;
      this.context.map.getTile(creature.pos).creature = creature;
    }
    this.broadcastPartialCreatureUpdate(creature, ['pos']);
    this.creatureStates[creature.id].warped = false;
  }

  public broadcastPartialCreatureUpdate(creature: Creature, keys: Array<keyof Creature>) {
    const partialCreature: Partial<Creature> = {
      id: creature.id,
    };
    for (const key of keys) {
      // @ts-ignore
      partialCreature[key] = creature[key];
    }
    this.broadcast(ProtocolBuilder.setCreature({
      partial: true,
      ...partialCreature,
    }));
  }

  public async warpCreature(creature: Creature, pos: TilePoint | null) {
    if (pos && !this.context.map.inBounds(pos)) return;

    if (pos) await this.ensureSectorLoadedForPoint(pos);
    this.moveCreature(creature, pos);
    this.creatureStates[creature.id].warped = true;
    this.creatureStates[creature.id].path = [];
  }

  public modifyCreatureLife(actor: Creature | null, creature: Creature, delta: number) {
    creature.life += delta;

    this.broadcast(ProtocolBuilder.setCreature({ partial: true, id: creature.id, life: creature.life }));

    if (delta < 0) {
      this.broadcast(ProtocolBuilder.animation({
        ...creature.pos,
        key: 'Attack',
      }));
    }

    if (creature.life <= 0) {
      this.removeCreature(creature);
      this.broadcast(ProtocolBuilder.animation({
        ...creature.pos,
        key: 'diescream',
      }));
    }
  }

  public removeCreature(creature: Creature) {
    delete this.context.map.getTile(creature.pos).creature;
    this.context.creatures.delete(creature.id);

    const creatureState = this.creatureStates[creature.id];
    if (creatureState) {
      for (const state of Object.values(this.creatureStates)) {
        state.respondToCreatureRemoval(creature);
      }
      delete this.creatureStates[creature.id];
    }

    this.broadcast(ProtocolBuilder.removeCreature({
      id: creature.id,
    }));
  }

  public findNearest(loc: TilePoint, range: number, includeTargetLocation: boolean,
                     predicate: (tile: Tile, loc: TilePoint) => boolean): TilePoint | null {
    const w = loc.w;
    const partition = this.context.map.getPartition(w);
    const test = (l: TilePoint) => {
      if (!partition.inBounds(l)) return false;
      return predicate(partition.getTile(l), l);
    };

    const x0 = loc.x;
    const y0 = loc.y;
    const z = loc.z;
    for (let offset = includeTargetLocation ? 0 : 1; offset <= range; offset++) {
      for (let y1 = y0 - offset; y1 <= offset + y0; y1++) {
        if (y1 === y0 - offset || y1 === y0 + offset) {
          for (let x1 = x0 - offset; x1 <= offset + x0; x1++) {
            if (test({ w, x: x1, y: y1, z })) {
              return { w, x: x1, y: y1, z };
            }
          }
        } else {
          if (test({ w, x: x0 - offset, y: y1, z })) {
            return { w, x: x0 - offset, y: y1, z };
          }
          if (test({ w, x: x0 + offset, y: y1, z })) {
            return { w, x: x0 + offset, y: y1, z };
          }
        }
      }
    }

    return null;
  }

  public addItemNear(loc: TilePoint, item: Item) {
    const nearestLoc = this.findNearest(loc, 6, true, (tile) => !tile.item || tile.item.type === item.type);
    if (!nearestLoc) return; // TODO what to do in this case?
    const nearestTile = this.context.map.getTile(nearestLoc);
    if (nearestTile.item) {
      nearestTile.item.quantity += item.quantity;
    } else {
      nearestTile.item = item;
    }

    this.broadcast(ProtocolBuilder.setItem({
      location: Utils.ItemLocation.World(nearestLoc),
      item: nearestTile.item,
    }));
  }

  public setFloor(loc: TilePoint, floor: number) {
    this.context.map.getTile(loc).floor = floor;
    this.broadcast(ProtocolBuilder.setFloor({
      ...loc,
      floor,
    }));
  }

  public setItem(loc: TilePoint, item?: Item) {
    this.context.map.getTile(loc).item = item;
    this.broadcast(ProtocolBuilder.setItem({
      location: Utils.ItemLocation.World(loc),
      item,
    }));
  }

  public setItemInContainer(id: number, index: number, item?: Item) {
    const container = this.context.containers.get(id);
    if (!container) throw new Error('no container: ' + id);

    container.items[index] = item || null;

    this.conditionalBroadcast(ProtocolBuilder.setItem({
      location: Utils.ItemLocation.Container(id, index),
      item,
    }), (clientConnection) => {
      return clientConnection.container.id === id || clientConnection.registeredContainers.includes(id);
    });
  }

  public addItemToContainer(id: number, index: number | undefined, item: Item) {
    const container = this.context.containers.get(id);
    if (!container) throw new Error('no container: ' + id);

    // If index is not specified, pick one:
    // Pick the first slot of the same item type, if stackable.
    // Else, pick the first open slot.
    if (index === undefined) {
      let firstOpenSlot = null;
      let firstStackableSlot = null;
      for (let i = 0; i < container.items.length; i++) {
        if (firstOpenSlot === null && !container.items[i]) {
          firstOpenSlot = i;
        }
        const containerItem = container.items[i];
        if (containerItem && containerItem.type === item.type) {
          firstStackableSlot = i;
          break;
        }
      }

      if (firstStackableSlot !== null) {
        index = firstStackableSlot;
        // @ts-ignore: verified to exist
        item.quantity += container.items[firstStackableSlot].quantity;
      } else if (firstOpenSlot !== null) {
        index = firstOpenSlot;
      }
    }

    if (index !== undefined) {
      this.setItemInContainer(id, index, item);
    } else {
      // TODO don't let containers grow unbounded.
      container.items.length += 1;
      this.setItemInContainer(id, container.items.length - 1, item);
    }
  }

  public grantXp(clientConnection: ClientConnection, skill: number, xp: number) {
    const currentXp = clientConnection.player.skills.get(skill);
    const newXp = (currentXp || 0) + xp;
    clientConnection.player.skills.set(skill, newXp);

    this.send(ProtocolBuilder.xp({
      skill,
      xp,
    }), clientConnection);
  }

  public ensureSectorLoaded(sectorPoint: TilePoint) {
    return this.context.map.getPartition(sectorPoint.w).getSectorAsync(sectorPoint);
  }

  public ensureSectorLoadedForPoint(loc: TilePoint) {
    const sectorPoint = Utils.worldToSector(loc, SECTOR_SIZE);
    return this.ensureSectorLoaded({ w: loc.w, ...sectorPoint });
  }

  private async initClient(clientConnection: ClientConnection) {
    const player = clientConnection.player;

    clientConnection.send(ProtocolBuilder.initialize({
      isAdmin: player.isAdmin,
      creatureId: player.creature.id,
      containerId: clientConnection.container.id,
      skills: [...player.skills.entries()],
    }));
    // TODO need much better loading.
    for (const [w, partition] of this.context.map.getPartitions()) {
      clientConnection.send(ProtocolBuilder.initializePartition({
        w,
        x: partition.width,
        y: partition.height,
        z: partition.depth,
      }));
    }
    // TODO: remove this line since "register creature" does the same. but removing breaks tests ...
    clientConnection.send(ProtocolBuilder.setCreature({ partial: false, ...player.creature }));
    clientConnection.send(ProtocolBuilder.container(await this.context.getContainer(clientConnection.container.id)));
    setTimeout(() => {
      this.broadcast(ProtocolBuilder.animation({ ...player.creature.pos, key: 'WarpIn' }));
    }, 1000);
  }

  private setupTickSections() {
    // Handle creatures.
    this.taskRunner.registerTickSection({
      description: 'creature states',
      fn: () => {
        for (const state of Object.values(this.creatureStates)) {
          state.tick(this);
        }
      },
    });

    // Handle stairs and warps.
    this.taskRunner.registerTickSection({
      description: 'stairs and warps',
      fn: async () => {
        for (const state of Object.values(this.creatureStates)) {
          const creature = state.creature;
          if (state.warped) continue;

          const map = this.context.map;
          const item = map.getItem(creature.pos);
          if (item) {
            const meta = Content.getMetaItem(item.type);

            let newPos = null;
            let playWarpSound = false;
            if (meta.class === 'CaveDown') {
              newPos = { ...creature.pos, z: creature.pos.z + 1 };
            } else if (meta.class === 'CaveUp') {
              newPos = { ...creature.pos, z: creature.pos.z - 1 };
            } else if (meta.trapEffect === 'Warp' && item.warpTo) {
              newPos = { ...item.warpTo };
              playWarpSound = true;
            }
            if (!newPos || !map.inBounds(newPos) || !await map.walkableAsync(newPos)) continue;

            await this.warpCreature(creature, newPos);
            if (playWarpSound) {
              this.broadcast(ProtocolBuilder.animation({
                ...creature.pos,
                key: 'WarpOut',
              }));
              this.broadcast(ProtocolBuilder.animation({
                ...newPos,
                key: 'WarpIn',
              }));
            }
          }
        }
      },
    });

    // Handle growth.
    // TODO: Only load part of the world in memory and simulate growth of inactive areas on load.
    const server = this;
    this.taskRunner.registerTickSection({
      description: 'growth',
      // RPGWO does 20 second growth intervals.
      rate: { seconds: 20 },
      *generator() {
        for (const [w, partition] of server.context.map.getPartitions()) {
          yield* server.growPartition(w, partition);
        }
      },
    });

    // Handle hunger.
    this.taskRunner.registerTickSection({
      description: 'hunger',
      rate: { minutes: 1 },
      fn: () => {
        for (const creature of this.context.creatures.values()) {
          if (!creature.eat_grass) return; // TODO: let all creature experience hunger pain.

          if (creature.food <= 0) {
            // TODO: reduce stamina instead?
            this.modifyCreatureLife(null, creature, -10);
          } else {
            creature.food -= 1;
          }
        }
      },
    });

    // Handle messages.
    this.taskRunner.registerTickSection({
      description: 'messages',
      fn: async () => {
        for (const clientConnection of this.clientConnections) {
          // only read one message from a client at a time
          const message = clientConnection.getMessage();
          if (!message) continue;

          if (this.verbose) console.log('from client', message.type, message.args);
          this.currentClientConnection = clientConnection;
          // performance.mark(`${message.type}-start`);
          try {
            const onMethodName = 'on' + message.type[0].toUpperCase() + message.type.substr(1);
            // @ts-ignore
            const ret = this._clientToServerProtocol[onMethodName](this, message.args);
            // TODO: some message handlers are async ... is that bad?
            if (ret) await ret;
          } catch (err) {
            // Don't let a bad message kill the message loop.
            console.error(err, message);
          }
          // performance.mark(`${message.type}-end`);
          // performance.measure(message.type, `${message.type}-start`, `${message.type}-end`);
        }

        // TODO stream marks somewhere, and pull in isomorphic node/browser performance.
        // console.log(performance.getEntries());
        // performance.clearMarks();
        // performance.clearMeasures();
        // performance.clearResourceTimings();

        for (const { message, to, filter } of this.outboundMessages) {
          // Send a message to:
          // 1) a specific client
          // 2) clients based on a filter
          // 3) everyone (broadcast)
          if (to) {
            to.send(message);
          } else if (filter) {
            for (const clientConnection of this.clientConnections) {
              // If connection is not logged in yet, skip.
              if (!clientConnection.player) continue;
              if (filter(clientConnection)) clientConnection.send(message);
            }
          } else {
            for (const clientConnection of this.clientConnections) {
              // If connection is not logged in yet, skip.
              if (!clientConnection.player) continue;
              clientConnection.send(message);
            }
          }
        }
        this.outboundMessages = [];
      },
    });

    this.taskRunner.registerTickSection({
      description: 'tick performance',
      rate: { seconds: 10 },
      fn: () => {
        if (!this.taskRunner.debugMeasureTiming) return;

        const perf = this.taskRunner.perf;

        // Only keep the last 10 seconds of ticks.
        const cutoff = performance.now() - 10 * 1000;
        const firstValid = perf.ticks.findIndex((tick) => tick.started >= cutoff);
        perf.ticks.splice(0, firstValid);
        perf.tickDurationAverage =
          perf.ticks.reduce((acc, cur) => acc + cur.duration, 0) / perf.ticks.length;
        perf.tickDurationMax = perf.ticks.reduce((acc, cur) => Math.max(acc, cur.duration), 0);
        const lastTick = perf.ticks[perf.ticks.length - 1];
        const secondsRange = (lastTick.started + lastTick.duration - perf.ticks[0].started) / 1000;
        const ticksPerSec = perf.ticks.length / secondsRange;
        const longestTick = perf.ticks.reduce((longest, cur) => {
          if (longest.duration > cur.duration) return longest;
          return cur;
        });

        // Send clients perf stats.
        const msg = JSON.stringify({
          ticksPerSec,
          avgDurationMs: perf.tickDurationAverage,
          maxDurationMs: perf.tickDurationMax,
          longestTick,
        }, null, 2);
        this.broadcast(ProtocolBuilder.log({ msg }));
      },
    });
  }

  private *growPartition(w: number, partition: WorldMapPartition) {
    // TODO: test which is faster?: iterate directly, iterate with getIteratorForArea, or iterate directly on partition.sectors

    let i = 0;
    for (const { pos, tile } of partition.getIteratorForArea({ x: 0, y: 0, z: 0 }, partition.width, partition.height)) {
      if (++i % 1000 === 0) yield;

      if (pos.z !== 0) continue; // TODO. No reason. lol.

      if (!tile.item) continue;

      const meta = Content.getMetaItem(tile.item.type);
      if (!meta || !meta.growthItem) continue;

      tile.item.growth = (tile.item.growth || 0) + 1;
      if (tile.item.growth < meta.growthDelta) continue;

      tile.item.type = meta.growthItem;
      tile.item.growth = 0;
      this.broadcast(ProtocolBuilder.setItem({
        location: Utils.ItemLocation.World({ ...pos, w }),
        item: tile.item,
      }));
    }

    // for (let x = 0; x < partition.width; x++) {
    //   for (let y = 0; y < partition.height; y++) {
    //     const pos = { x, y, z: 0 };
    //     const item = partition.getItem(pos);
    //     if (!item) continue;
    //     const meta = Content.getMetaItem(item.type);
    //     if (!meta || !meta.growthItem) continue;

    //     item.growth = (item.growth || 0) + 1;
    //     if (item.growth >= meta.growthDelta) {
    //       item.type = meta.growthItem;
    //       item.growth = 0;
    //       this.broadcast(ProtocolBuilder.setItem({
    //         location: Utils.ItemLocation.World({ ...pos, w }),
    //         item,
    //       }));
    //     }
    //   }
    // }
  }
}
