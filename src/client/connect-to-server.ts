import { Context } from '../context';
import Player from '../player';
import { ServerToClientProtocol } from '../protocol';
import ClientConnection from '../server/client-connection';
import WorldMap from '../world-map';
import Client from './client';

function createClientWorldMap(wire: ClientToServerWire) {
  const map = new WorldMap();
  map.loader = (sectorPoint) => {
    wire.send('requestSector', sectorPoint);
    return map.createEmptySector(); // temporary until server sends something
  };
  return map;
}

export async function connect(client: Client, port: number): Promise<ClientToServerWire> {
  const verbose = true;

  const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${scheme}://${window.location.hostname}:${port}`);

  const wire: ClientToServerWire = {
    send(type, args) {
      ws.send(JSON.stringify({
        type,
        args,
      }));
    },
    receive(type, args) {
      // @ts-ignore
      if (window.Gridia.verbose) console.log('from server', type, args);
      const p = ServerToClientProtocol[type];
      // @ts-ignore
      p(client, args);
      // Allow for hooks in the main client code. Should
      // only be used for refreshing UI, not updating game state.
      client.eventEmitter.emit('message', {type, args});
    },
  };
  client.context = new Context(createClientWorldMap(wire));

  ws.addEventListener('message', (e) => {
    const parsed = JSON.parse(e.data);
    wire.receive(parsed.type, parsed.args);
  });

  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('close', reject);
  });

  ws.addEventListener('close', () => {
    window.document.body.innerText = 'Lost connection to server. Please refresh.';
  });

  return wire;
}

interface OpenAndConnectToServerInMemoryOpts {
  dummyDelay: number;
  verbose: boolean;
  context?: import('../server/server-context').ServerContext;
}
export async function openAndConnectToServerInMemory(client: Client, opts: OpenAndConnectToServerInMemoryOpts) {
  const {Server, ServerContext, createDebugWorldMap} = await import('./server-in-client-chunk');

  function maybeDelay(fn: () => void) {
    if (dummyDelay > 0) {
      setTimeout(fn, dummyDelay);
    } else {
      fn();
    }
  }

  const worldMap = createDebugWorldMap();
  const { dummyDelay, verbose, context } = opts;
  const server = new Server({
    context: context ? context : new ServerContext(worldMap),
    verbose,
  });

  const clientConnection = new ClientConnection();
  clientConnection.send = (type, args) => {
    maybeDelay(() => {
      wire.receive(type, args);
    });
  };
  server.clientConnections.push(clientConnection);

  // Make sure to clone args so no objects are accidently shared.
  const wire: ClientToServerWire = {
    send(type, args) {
      // const p = ServerToClientProtocol[type]
      maybeDelay(() => {
        clientConnection.messageQueue.push({
          type,
          args: JSON.parse(JSON.stringify(args)),
        });
      });
    },
    receive(type, args) {
      if (server.verbose) console.log('from server', type, args);
      const p = ServerToClientProtocol[type];
      // @ts-ignore
      p(client, JSON.parse(JSON.stringify(args)));
      // Allow for hooks in the main client code. Should
      // only be used for refreshing UI, not updating game state.
      client.eventEmitter.emit('message', {type, args});
    },
  };
  client.context = new Context(createClientWorldMap(wire));

  return { clientToServerWire: wire, server };
}
