import Container from '../container';
import Player from '../player';

// TODO: this whole thing smells.

export default class ClientConnection {
  public messageQueue: any[] = [];

  // @ts-ignore
  public player: Player;

  // @ts-ignore
  public container: Container;

  // @ts-ignore
  public send: (message: ServerToClientMessage) => void;

  public registeredContainers = [] as number[];

  public getMessage(): any {
    return this.messageQueue.shift();
  }

  public hasMessage(): boolean {
    return this.messageQueue.length > 0;
  }
}
