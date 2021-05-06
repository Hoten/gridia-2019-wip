/* Auto generated by build/build-protocol.js */

import Server from '../../server/server'

export default interface ICommands {
    onAdminSetFloor(server: Server, { floor, ...loc }: Protocol.Commands.AdminSetFloor["params"]): Promise<Protocol.Commands.AdminSetFloor["response"]>;
    onAdminSetItem(server: Server, { item, ...loc }: Protocol.Commands.AdminSetItem["params"]): Promise<Protocol.Commands.AdminSetItem["response"]>;
    onCastSpell(server: Server, { id, loc }: Protocol.Commands.CastSpell["params"]): Promise<Protocol.Commands.CastSpell["response"]>;
    onChat(server: Server, { text }: Protocol.Commands.Chat["params"]): Promise<Protocol.Commands.Chat["response"]>;
    onCloseContainer(server: Server, { containerId }: Protocol.Commands.CloseContainer["params"]): Promise<Protocol.Commands.CloseContainer["response"]>;
    onCreatePlayer(server: Server, { name, attributes, skills }: Protocol.Commands.CreatePlayer["params"]): Promise<Protocol.Commands.CreatePlayer["response"]>;
    onCreatureAction(server: Server, { creatureId, type }: Protocol.Commands.CreatureAction["params"]): Promise<Protocol.Commands.CreatureAction["response"]>;
    onDialogueResponse(server: Server, { choiceIndex }: Protocol.Commands.DialogueResponse["params"]): Promise<Protocol.Commands.DialogueResponse["response"]>;
    onEnterWorld(server: Server, { playerId }: Protocol.Commands.EnterWorld["params"]): Promise<Protocol.Commands.EnterWorld["response"]>;
    onLogin(server: Server, { username, password }: Protocol.Commands.Login["params"]): Promise<Protocol.Commands.Login["response"]>;
    onLogout(server: Server, {}: Protocol.Commands.Logout["params"]): Promise<Protocol.Commands.Logout["response"]>;
    onMove(server: Server, { ...loc }: Protocol.Commands.Move["params"]): Promise<Protocol.Commands.Move["response"]>;
    onMoveItem(server: Server, { from, quantity, to }: Protocol.Commands.MoveItem["params"]): Promise<Protocol.Commands.MoveItem["response"]>;
    onRegisterAccount(server: Server, { username, password }: Protocol.Commands.RegisterAccount["params"]): Promise<Protocol.Commands.RegisterAccount["response"]>;
    onRequestContainer(server: Server, { containerId, loc }: Protocol.Commands.RequestContainer["params"]): Promise<Protocol.Commands.RequestContainer["response"]>;
    onRequestCreature(server: Server, { id }: Protocol.Commands.RequestCreature["params"]): Promise<Protocol.Commands.RequestCreature["response"]>;
    onRequestPartition(server: Server, { w }: Protocol.Commands.RequestPartition["params"]): Promise<Protocol.Commands.RequestPartition["response"]>;
    onRequestSector(server: Server, { ...loc }: Protocol.Commands.RequestSector["params"]): Promise<Protocol.Commands.RequestSector["response"]>;
    onUse(server: Server, { toolIndex, location, usageIndex }: Protocol.Commands.Use["params"]): Promise<Protocol.Commands.Use["response"]>;
}