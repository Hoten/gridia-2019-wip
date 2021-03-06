import * as Content from '../content';
import * as WireSerializer from '../lib/wire-serializer';
import { makeMapImage } from '../lib/map-generator/map-image-maker';
import mapgen, { makeBareMap } from '../mapgen';
import WorldMap from '../world-map';
import WorldMapPartition from '../world-map-partition';
import { FsApiFs, IdbFs, IsoFs } from '../iso-fs';
import ClientConnection from './client-connection';
import { startServer as _startServer } from './create-server';
import Server from './server';
import { ServerContext } from './server-context';

let opts: ServerWorkerOpts;
let server: Server;
let clientConnection: ClientConnection;

let mapPreviewPartition: WorldMapPartition | null = null;
let mapPreviewGenData: ReturnType<typeof mapgen>['mapGenResult'] | null = null;

let mapsFs: IsoFs;

function maybeDelay(fn: () => void) {
  if (opts.dummyDelay > 0) {
    setTimeout(fn, opts.dummyDelay);
  } else {
    fn();
  }
}

async function makeFsForMap(name: string) {
  if (initArgs_.directoryHandle) {
    return new FsApiFs(await initArgs_.directoryHandle.getDirectoryHandle(name));
  } else {
    return new IdbFs(name);
  }
}

async function saveMapGen(name: string) {
  if (!mapPreviewPartition) throw new Error('missing mapPreviewPartition');

  await mapsFs.mkdir(name);
  const world = new WorldMap();
  world.addPartition(0, mapPreviewPartition);

  const context = new ServerContext(world, await makeFsForMap(name));
  await context.save();
}

interface InitArgs {
  directoryHandle?: FileSystemDirectoryHandle;
}
let initArgs_: InitArgs;
async function init(args: InitArgs) {
  initArgs_ = args;
  if (args.directoryHandle) {
    mapsFs = new FsApiFs(args.directoryHandle);
  } else {
    mapsFs = new IdbFs('');
  }
  await Content.loadContentFromNetwork();
}

async function listMaps() {
  // TODO: add {type: FOLDER} to readdir.
  const mapNames = (await mapsFs.readdir('')).filter((name) => !name.startsWith('.'));
  mapNames.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return { mapNames };
}

interface GenerateMapArgs {
  bare: boolean; width: number; height: number; depth: number; seeds: { [id: string]: number };
  canvas?: OffscreenCanvas;
}
function generateMap(args: GenerateMapArgs) {
  if (args.bare) {
    mapPreviewPartition = makeBareMap(args.width, args.height, args.depth);
  } else {
    // @ts-ignore: TODO
    const mapGenResult = mapgen(args);
    mapPreviewPartition = mapGenResult.partition;
    mapPreviewGenData = mapGenResult.mapGenResult;
  }

  if (mapPreviewGenData && args.canvas) {
    // @ts-ignore: Hack to make canvas-node use the given OffscreenCanvas.
    global.document = {
      createElement() {
        return args.canvas;
      },
    };

    // This draws to the OffscreenCanvas.
    makeMapImage(mapPreviewGenData);
  }

  return Promise.resolve();
}

async function saveGeneratedMap(args: { name: string }) {
  await saveMapGen(args.name);
}

async function startServer(args: ServerWorkerOpts) {
  opts = args; // :(

  clientConnection = new ClientConnection();
  clientConnection.send = (message) => {
    maybeDelay(() => {
      // @ts-ignore
      self.postMessage(WireSerializer.serialize(message));
    });
  };

  server = await _startServer(args, await makeFsForMap(args.mapName));
  server.context.clientConnections.push(clientConnection);
}

async function shutdown() {
  if (!server) return;

  await server.save();
}

export const RpcMap = {
  init,
  listMaps,
  generateMap,
  saveGeneratedMap,
  startServer,
  shutdown,
};

self.addEventListener('message', async (e) => {
  // eslint-disable-next-line
  if (e.data.type === 'rpc') {
    // @ts-ignore
    // eslint-disable-next-line
    const result = await RpcMap[e.data.method](e.data.args);
    // @ts-ignore
    self.postMessage({
      // eslint-disable-next-line
      rpc: e.data.id,
      // eslint-disable-next-line
      result,
    });

    return;
  }

  maybeDelay(() => {
    clientConnection.messageQueue.push(WireSerializer.deserialize(e.data));
  });
}, false);
