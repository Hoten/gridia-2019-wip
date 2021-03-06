/* Auto generated by build/build-protocol.js */

type AdminSetFloorCommand = {
    type: "adminSetFloor";
    args: Protocol.Commands.AdminSetFloor;
};
type AdminSetItemCommand = {
    type: "adminSetItem";
    args: Protocol.Commands.AdminSetItem;
};
type CastSpellCommand = {
    type: "castSpell";
    args: Protocol.Commands.CastSpell;
};
type ChatCommand = {
    type: "chat";
    args: Protocol.Commands.Chat;
};
type CloseContainerCommand = {
    type: "closeContainer";
    args: Protocol.Commands.CloseContainer;
};
type CreatePlayerCommand = {
    type: "createPlayer";
    args: Protocol.Commands.CreatePlayer;
};
type CreatureActionCommand = {
    type: "creatureAction";
    args: Protocol.Commands.CreatureAction;
};
type DialogueResponseCommand = {
    type: "dialogueResponse";
    args: Protocol.Commands.DialogueResponse;
};
type EnterWorldCommand = {
    type: "enterWorld";
    args: Protocol.Commands.EnterWorld;
};
type LoginCommand = {
    type: "login";
    args: Protocol.Commands.Login;
};
type LogoutCommand = {
    type: "logout";
    args: Protocol.Commands.Logout;
};
type MoveCommand = {
    type: "move";
    args: Protocol.Commands.Move;
};
type MoveItemCommand = {
    type: "moveItem";
    args: Protocol.Commands.MoveItem;
};
type RegisterAccountCommand = {
    type: "registerAccount";
    args: Protocol.Commands.RegisterAccount;
};
type RequestContainerCommand = {
    type: "requestContainer";
    args: Protocol.Commands.RequestContainer;
};
type RequestCreatureCommand = {
    type: "requestCreature";
    args: Protocol.Commands.RequestCreature;
};
type RequestPartitionCommand = {
    type: "requestPartition";
    args: Protocol.Commands.RequestPartition;
};
type RequestSectorCommand = {
    type: "requestSector";
    args: Protocol.Commands.RequestSector;
};
type UseCommand = {
    type: "use";
    args: Protocol.Commands.Use;
};
type LearnSkillCommand = {
    type: "learnSkill";
    args: Protocol.Commands.LearnSkill;
};

export type ProtocolCommand = AdminSetFloorCommand | AdminSetItemCommand | CastSpellCommand | ChatCommand | CloseContainerCommand | CreatePlayerCommand | CreatureActionCommand | DialogueResponseCommand | EnterWorldCommand | LoginCommand | LogoutCommand | MoveCommand | MoveItemCommand | RegisterAccountCommand | RequestContainerCommand | RequestCreatureCommand | RequestPartitionCommand | RequestSectorCommand | UseCommand | LearnSkillCommand;

export function adminSetFloor({ floor, ...loc }: Protocol.Commands.AdminSetFloor["params"]): AdminSetFloorCommand {
    return { type: "adminSetFloor", args: arguments[0] };
}
export function adminSetItem({ item, ...loc }: Protocol.Commands.AdminSetItem["params"]): AdminSetItemCommand {
    return { type: "adminSetItem", args: arguments[0] };
}
export function castSpell({ id, creatureId, loc }: Protocol.Commands.CastSpell["params"]): CastSpellCommand {
    return { type: "castSpell", args: arguments[0] };
}
export function chat({ text }: Protocol.Commands.Chat["params"]): ChatCommand {
    return { type: "chat", args: arguments[0] };
}
export function closeContainer({ containerId }: Protocol.Commands.CloseContainer["params"]): CloseContainerCommand {
    return { type: "closeContainer", args: arguments[0] };
}
export function createPlayer({ name, attributes, skills }: Protocol.Commands.CreatePlayer["params"]): CreatePlayerCommand {
    return { type: "createPlayer", args: arguments[0] };
}
export function creatureAction({ creatureId, type }: Protocol.Commands.CreatureAction["params"]): CreatureActionCommand {
    return { type: "creatureAction", args: arguments[0] };
}
export function dialogueResponse({ choiceIndex }: Protocol.Commands.DialogueResponse["params"]): DialogueResponseCommand {
    return { type: "dialogueResponse", args: arguments[0] };
}
export function enterWorld({ playerId }: Protocol.Commands.EnterWorld["params"]): EnterWorldCommand {
    return { type: "enterWorld", args: arguments[0] };
}
export function login({ username, password }: Protocol.Commands.Login["params"]): LoginCommand {
    return { type: "login", args: arguments[0] };
}
export function logout({}: Protocol.Commands.Logout["params"]): LogoutCommand {
    return { type: "logout", args: arguments[0] };
}
export function move({ ...loc }: Protocol.Commands.Move["params"]): MoveCommand {
    return { type: "move", args: arguments[0] };
}
export function moveItem({ from, quantity, to }: Protocol.Commands.MoveItem["params"]): MoveItemCommand {
    return { type: "moveItem", args: arguments[0] };
}
export function registerAccount({ username, password }: Protocol.Commands.RegisterAccount["params"]): RegisterAccountCommand {
    return { type: "registerAccount", args: arguments[0] };
}
export function requestContainer({ containerId, loc }: Protocol.Commands.RequestContainer["params"]): RequestContainerCommand {
    return { type: "requestContainer", args: arguments[0] };
}
export function requestCreature({ id }: Protocol.Commands.RequestCreature["params"]): RequestCreatureCommand {
    return { type: "requestCreature", args: arguments[0] };
}
export function requestPartition({ w }: Protocol.Commands.RequestPartition["params"]): RequestPartitionCommand {
    return { type: "requestPartition", args: arguments[0] };
}
export function requestSector({ ...loc }: Protocol.Commands.RequestSector["params"]): RequestSectorCommand {
    return { type: "requestSector", args: arguments[0] };
}
export function use({ toolIndex, location, usageIndex }: Protocol.Commands.Use["params"]): UseCommand {
    return { type: "use", args: arguments[0] };
}
export function learnSkill({ id }: Protocol.Commands.LearnSkill["params"]): LearnSkillCommand {
    return { type: "learnSkill", args: arguments[0] };
}