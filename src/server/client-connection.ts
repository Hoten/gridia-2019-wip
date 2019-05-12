import Container from '../container';

export default class ClientConnection {
  public messageQueue: any[] = [];

  public creature: Creature;

  public container: Container;

  public send: WireMethod<typeof import('../protocol')['ServerToClientProtocol']>;

  public registeredContainers = [] as number[];

  public getMessage(): any {
    return this.messageQueue.shift();
  }

  public hasMessage(): boolean {
    return this.messageQueue.length > 0;
  }
}