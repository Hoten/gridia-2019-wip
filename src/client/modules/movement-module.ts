import * as Content from '../../content';
import { findPath } from '../../path-finding';
import * as ProtocolBuilder from '../../protocol/client-to-server-protocol-builder';
import { equalPoints } from '../../utils';
import ClientModule from '../client-module';
import Game from '../game';
import * as Helper from '../helper';
import KEYS from '../keys';

class MovementClientModule extends ClientModule {
  protected followCreature: Creature | null = null;
  protected pathToDestination: PartitionPoint[];
  protected lastMove: number = performance.now();

  constructor(game: Game) {
    super(game);
    this.onAction = this.onAction.bind(this);
  }

  public onStart() {
    this.game.client.eventEmitter.on('Action', this.onAction);
    this.game.addActionCreator((tile) => {
      if (tile.creature) {
        return {
          type: 'follow',
          innerText: 'Follow',
          title: 'Follow',
        };
      }
    });
  }

  public onTick() {
    const focusCreature = this.game.client.context.getCreature(this.game.client.creatureId);
    const focusPos = this.game.getPlayerPosition();
    const w = focusPos.w;
    const partition = this.game.client.context.map.getPartition(w);

    if (!focusCreature) return;
    // if (this.game.client.context.map.width === 0) return;

    if (performance.now() - this.lastMove > 300) {
      let dest: TilePoint = { ...focusCreature.pos };

      const keyInputDelta = {x: 0, y: 0, z: 0};
      if (this.game.keys[KEYS.W]) {
        keyInputDelta.y -= 1;
      } else if (this.game.keys[KEYS.S]) {
        keyInputDelta.y += 1;
      }
      if (this.game.keys[KEYS.A]) {
        keyInputDelta.x -= 1;
      } else if (this.game.keys[KEYS.D]) {
        keyInputDelta.x += 1;
      }

      const lastInPath = this.pathToDestination && this.pathToDestination.length > 0
        ? this.pathToDestination[this.pathToDestination.length - 1]
        : null;
      if (lastInPath && !this.followCreature && lastInPath.z !== focusCreature.pos.z) {
        this.invalidateDestination();
      }

      if (this.followCreature &&
        (this.followCreature.pos.w !== focusPos.w || this.followCreature.pos.z !== focusPos.z)) {
        this.invalidateDestination();
      }

      // TODO: only re-calc if path is obstructed.
      if (this.followCreature) {
        this.pathToDestination = findPath(partition, focusPos, this.followCreature.pos);
      } else if (lastInPath) {
        // re-calc
        this.pathToDestination = findPath(partition, focusPos, lastInPath);
      }

      if (!equalPoints(keyInputDelta, {x: 0, y: 0, z: 0})) {
        dest = { ...focusCreature.pos };
        dest.x += keyInputDelta.x;
        dest.y += keyInputDelta.y;
        this.invalidateDestination();
      } else if (this.pathToDestination) {
        dest = { w, ...this.pathToDestination.splice(0, 1)[0]};
      }

      if (dest && !equalPoints(dest, focusCreature.pos)) {
        const itemToMoveTo = this.game.client.context.map.getItem(dest);
        if (itemToMoveTo && Content.getMetaItem(itemToMoveTo.type).class === 'Container') {
          Helper.openContainer(dest);
        }

        if (this.game.client.context.map.walkable(dest)) {
          this.lastMove = performance.now();
          this.game.client.wire.send(ProtocolBuilder.move(dest));
          this.game.client.eventEmitter.emit('PlayerMove');
          delete this.game.state.mouse.tile;
        }
      }
    }
  }

  public onAction(e: GameActionEvent) {
    const type = e.action.type;
    const {loc} = e;

    if (type === 'move-here') {
      const focusPos = this.game.getPlayerPosition();
      const partition = this.game.client.context.map.getPartition(focusPos.w);

      this.pathToDestination = findPath(partition, focusPos, loc);
      this.followCreature = null;
    } else if (type === 'follow') {
      this.followCreature = e.creature;
      this.pathToDestination = null;
    }
  }

  protected invalidateDestination() {
    this.pathToDestination = null;
    this.followCreature = null;
  }
}

export default MovementClientModule;
