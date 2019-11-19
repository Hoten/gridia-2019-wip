import * as Content from '../content';
import { makeGame } from '../game-singleton';
import * as ProtocolBuilder from '../protocol/client-to-server-protocol-builder';
import * as Utils from '../utils';
import Client from './client';
import { connect, openAndConnectToServerWorker } from './connect-to-server';
import { GameActionEvent } from './event-emitter';
import * as Helper from './helper';
import AdminClientModule from './modules/admin-module';
import MovementClientModule from './modules/movement-module';
import SettingsClientModule from './modules/settings-module';
import SkillsClientModule from './modules/skills-module';

function globalActionCreator(tile: Tile, loc: TilePoint): GameAction[] {
  const item = tile.item;
  const meta = Content.getMetaItem(item ? item.type : 0);
  const actions = [] as Array<{innerText: string, title: string, type: string}>;

  if (item && meta.moveable) {
    actions.push({
      type: 'pickup',
      innerText: 'Pickup',
      title: 'Shortcut: Shift',
    });
  }

  if (item && Helper.canUseHand(item.type)) {
    actions.push({
      type: 'use-hand',
      innerText: 'Use Hand',
      title: 'Shortcut: Alt',
    });
  }

  if (meta.class === 'Container') {
    actions.push({
      type: 'open-container',
      innerText: 'Open',
      title: 'Look inside',
    });
  }

  if (meta.class === 'Ball') {
    actions.push({
      type: 'throw',
      innerText: 'Throw ball',
      title: 'Throw ball',
    });
  }

  const tool = Helper.getSelectedTool();
  if (tool && Helper.usageExists(tool.type, meta.id)) {
    actions.push({
      type: 'use-tool',
      innerText: `Use ${Content.getMetaItem(tool.type).name}`,
      title: 'Shortcut: Spacebar',
    });
  }

  if (tile.creature && !tile.creature.tamedBy && !tile.creature.isPlayer) {
    actions.push({
      type: 'tame',
      innerText: 'Tame',
      title: '',
    });
  }

  return actions;
}

function globalOnActionHandler(client: Client, e: GameActionEvent) {
  const type = e.action.type;
  const {creature, loc} = e;

  switch (type) {
    case 'pickup':
      client.connection.send(ProtocolBuilder.moveItem({
        fromSource: 0,
        from: loc,
        toSource: client.containerId,
      }));
      break;
    case 'use-hand':
      Helper.useHand(loc);
      break;
    case 'use-tool':
      Helper.useTool(loc);
      break;
    case 'open-container':
      Helper.openContainer(loc);
      break;
    case 'tame':
      client.connection.send(ProtocolBuilder.tame({
        creatureId: creature.id,
      }));
      break;
    case 'throw':
      // TODO
      break;
  }
}

function createClient() {
  let connectOverSocket = !window.location.hostname.includes('localhost');
  if (window.location.search.includes('server')) {
    connectOverSocket = true;
  } else if (window.location.search.includes('worker')) {
    connectOverSocket = false;
  }

  if (connectOverSocket) {
    return connect(9001);
  }

  return openAndConnectToServerWorker({
    serverData: '/',
    dummyDelay: 20,
    verbose: false,
  });
}

function setupDebugging(client: Client) {
  // @ts-ignore
  window.Gridia = {
    client,
    item(itemType: number) {
      console.log(Content.getMetaItem(itemType));
      console.log('tool', Content.getItemUsesForTool(itemType));
      console.log('focus', Content.getItemUsesForFocus(itemType));
      console.log('product', Content.getItemUsesForProduct(itemType));
    },
  };

  // TODO: better 'verbose' / logging (make a logger class).
  console.log('For debugging:\nwindow.Gridia.verbose = true;');
  // @ts-ignore
  window.Gridia.serverWorker = client.connection._worker;
  // TODO: this doesn't work anymore.
  // console.log('For debugging:\nwindow.Gridia.server.verbose = true;');
}

document.addEventListener('DOMContentLoaded', async () => {
  const client = await createClient();
  setupDebugging(client);

  const registerBtn = Helper.find('.register-btn');
  const registerNameEl = Helper.find('#register--name') as HTMLInputElement;

  const parts1 = 'Small Smelly Quick Steely Quiet'.split(' ');
  const parts2 = 'Jill Stranger Arthur Maz Harlet Worker'.split(' ');
  registerNameEl.value = parts1[Utils.randInt(0, parts1.length)] + ' ' + parts2[Utils.randInt(0, parts2.length)];
  registerBtn.addEventListener('click', () => {
    client.connection.send(ProtocolBuilder.register({
      name: registerNameEl.value,
    }));
  });

  await Content.loadContentFromNetwork();

  // Wait for initialize message. This happens after a successful login.
  await new Promise((resolve, reject) => {
    client.eventEmitter.once('message', (e) => {
      if (e.type === 'initialize') resolve();
      else reject(`first message should be initialize, but got ${JSON.stringify(e)}`);
    });
  });
  const gameSingleton = makeGame(client);

  // TODO: AdminClientModule should create the panel. Until then, manually remove panel.
  if (!client.isAdmin) {
    Helper.find('.panels__tab[data-panel="admin"]').remove();
  }

  const moduleClasses = [
    MovementClientModule,
    SettingsClientModule,
    SkillsClientModule,
  ];
  if (client.isAdmin) moduleClasses.push(AdminClientModule);
  for (const moduleClass of moduleClasses) {
    gameSingleton.addModule(new moduleClass(gameSingleton));
  }
  gameSingleton.addActionCreator(globalActionCreator);
  client.eventEmitter.on('action', globalOnActionHandler.bind(globalOnActionHandler, client));

  gameSingleton.start();
  // @ts-ignore
  window.Gridia.game = gameSingleton;

  Helper.find('.register').classList.add('hidden');
  Helper.find('.game').classList.remove('hidden');
});
