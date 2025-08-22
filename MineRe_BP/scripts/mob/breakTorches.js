import { world } from "@minecraft/server";
import { getBlock } from "block/blockUtils";
import { GREMLIN_BREAKS_TORCHES } from "settings";
const torchSet = new Set();
torchSet.add("minecraft:torch");
torchSet.add("minecraft:copper_torch");
torchSet.add("minecraft:soul_torch");
torchSet.add("minecraft:redstone_torch");
/**
 * Break all torches around an entity within a cubic radius.
 * @param entity The entity around which to break torches
 * @param radius The radius to scan in each direction
 */
export function breakTorches(entity, radius) {
    if (!entity?.isValid)
        return;
    if (!world?.getDynamicProperty(GREMLIN_BREAKS_TORCHES).valueOf()) {
        return;
    }
    const dimension = entity.dimension;
    const base = entity.location;
    let torchesBroken = 0;
    // Loop in a cube around the entity
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dz = -radius; dz <= radius; dz++) {
                const x = Math.floor(base.x + dx) + 0.5;
                const y = Math.floor(base.y + dy) + 0.5;
                const z = Math.floor(base.z + dz) + 0.5;
                const block = getBlock(dimension, { x, y, z });
                if (!block)
                    continue;
                if (torchSet.has(block.typeId)) {
                    // Destroy block with particles and drops
                    entity.runCommand(`setblock ${x} ${y} ${z} air destroy`);
                    torchesBroken++;
                }
            }
        }
    }
    if (torchesBroken > 0) {
        entity.triggerEvent("minere:play_attack_animation");
    }
}
