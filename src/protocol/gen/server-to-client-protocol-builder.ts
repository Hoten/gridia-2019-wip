/* Auto generated by build/build-protocol.js */

type AnimationMessage = {
    type: "animation";
    args: ServerToClientProtocol.Params.Animation;
};
type ContainerMessage = {
    type: "container";
    args: ServerToClientProtocol.Params.Container;
};
type InitializeMessage = {
    type: "initialize";
    args: ServerToClientProtocol.Params.Initialize;
};
type InitializePartitionMessage = {
    type: "initializePartition";
    args: ServerToClientProtocol.Params.InitializePartition;
};
type LogMessage = {
    type: "log";
    args: ServerToClientProtocol.Params.Log;
};
type RemoveCreatureMessage = {
    type: "removeCreature";
    args: ServerToClientProtocol.Params.RemoveCreature;
};
type SectorMessage = {
    type: "sector";
    args: ServerToClientProtocol.Params.Sector;
};
type SetCreatureMessage = {
    type: "setCreature";
    args: ServerToClientProtocol.Params.SetCreature;
};
type SetFloorMessage = {
    type: "setFloor";
    args: ServerToClientProtocol.Params.SetFloor;
};
type SetItemMessage = {
    type: "setItem";
    args: ServerToClientProtocol.Params.SetItem;
};
type XpMessage = {
    type: "xp";
    args: ServerToClientProtocol.Params.Xp;
};
type ChatMessage = {
    type: "chat";
    args: ServerToClientProtocol.Params.Chat;
};
type TimeMessage = {
    type: "time";
    args: ServerToClientProtocol.Params.Time;
};

export type Message = AnimationMessage | ContainerMessage | InitializeMessage | InitializePartitionMessage | LogMessage | RemoveCreatureMessage | SectorMessage | SetCreatureMessage | SetFloorMessage | SetItemMessage | XpMessage | ChatMessage | TimeMessage;

export function animation({ key, ...loc }: ServerToClientProtocol.Params.Animation): AnimationMessage {
    return { type: "animation", args: arguments[0] };
}
export function container({ id, items }: ServerToClientProtocol.Params.Container): ContainerMessage {
    return { type: "container", args: arguments[0] };
}
export function initialize({ player }: ServerToClientProtocol.Params.Initialize): InitializeMessage {
    return { type: "initialize", args: arguments[0] };
}
export function initializePartition({ ...loc }: ServerToClientProtocol.Params.InitializePartition): InitializePartitionMessage {
    return { type: "initializePartition", args: arguments[0] };
}
export function log({ msg }: ServerToClientProtocol.Params.Log): LogMessage {
    return { type: "log", args: arguments[0] };
}
export function removeCreature({ id }: ServerToClientProtocol.Params.RemoveCreature): RemoveCreatureMessage {
    return { type: "removeCreature", args: arguments[0] };
}
export function sector({ tiles, ...loc }: ServerToClientProtocol.Params.Sector): SectorMessage {
    return { type: "sector", args: arguments[0] };
}
export function setCreature({ partial, ...creature }: ServerToClientProtocol.Params.SetCreature): SetCreatureMessage {
    return { type: "setCreature", args: arguments[0] };
}
export function setFloor({ floor, ...loc }: ServerToClientProtocol.Params.SetFloor): SetFloorMessage {
    return { type: "setFloor", args: arguments[0] };
}
export function setItem({ location, item }: ServerToClientProtocol.Params.SetItem): SetItemMessage {
    return { type: "setItem", args: arguments[0] };
}
export function xp({ skill, xp }: ServerToClientProtocol.Params.Xp): XpMessage {
    return { type: "xp", args: arguments[0] };
}
export function chat({ from, to, message }: ServerToClientProtocol.Params.Chat): ChatMessage {
    return { type: "chat", args: arguments[0] };
}
export function time({ time }: ServerToClientProtocol.Params.Time): TimeMessage {
    return { type: "time", args: arguments[0] };
}