import {Server as WebSocketServer} from 'ws';
import mapgen from './mapgen';
import ClientConnection from './server/clientConnection';
import Server from './server/server';

function startServer(port: number) {
  const verbose = true;

  const server = new Server({
    verbose,
  });
  const world = mapgen(100, 100, 1, false);
  server.world = world;

  const wss = new WebSocketServer({
    port,
  });

  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      if (verbose) console.log('got', JSON.parse(data.toString('utf-8')));
      clientConnection.messageQueue.push(JSON.parse(data.toString('utf-8')));
    });

    const clientConnection = new ClientConnection();
    clientConnection.send = function(type, args) {
      ws.send(JSON.stringify({type, args}));
    };

    server.addClient(clientConnection);
  });

  setInterval(() => {
    server.tick();
  }, 50);

  setInterval(() => {
    server.world.saveAll();
  }, 1000 * 60 * 5);

  return server;
}

startServer(9001);