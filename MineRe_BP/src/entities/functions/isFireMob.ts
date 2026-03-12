import { Entity } from "@minecraft/server";

const fireMobs = new Set<string>(["minere:inferno", "minecraft:blaze"]);
const iceMobs = new Set<string>(["minere:freeze", "minere:glacier"]);

export function isFireMob(entity: Entity) {
    return fireMobs.has(entity.typeId);
}

export function isIceMob(entity: Entity) {
    return iceMobs.has(entity.typeId);
}