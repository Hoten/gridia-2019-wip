/* Auto generated by build/build-protocol.js */

import Client from '../../client/client'

export default interface IEvents {
    onAnimation(client: Client, { key, ...loc }: Protocol.Events.Animation): void;
    onContainer(client: Client, { container }: Protocol.Events.Container): void;
    onInitialize(client: Client, { player, secondsPerWorldTick, ticksPerWorldDay }: Protocol.Events.Initialize): void;
    onInitializePartition(client: Client, { ...loc }: Protocol.Events.InitializePartition): void;
    onLog(client: Client, { msg }: Protocol.Events.Log): void;
    onRemoveCreature(client: Client, { id }: Protocol.Events.RemoveCreature): void;
    onSector(client: Client, { tiles, ...loc }: Protocol.Events.Sector): void;
    onSetCreature(client: Client, { partial, ...creature }: Protocol.Events.SetCreature): void;
    onSetFloor(client: Client, { floor, ...loc }: Protocol.Events.SetFloor): void;
    onSetItem(client: Client, { location, item }: Protocol.Events.SetItem): void;
    onXp(client: Client, { skill, xp }: Protocol.Events.Xp): void;
    onChat(client: Client, { from, to, message }: Protocol.Events.Chat): void;
    onTime(client: Client, { epoch }: Protocol.Events.Time): void;
    onDialogue(client: Client, { speaker, text, choices }: Protocol.Events.Dialogue): void;
}