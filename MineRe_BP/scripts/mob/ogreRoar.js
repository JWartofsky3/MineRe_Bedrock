import { world, system, EntityComponentTypes, } from "@minecraft/server";
import { distVector3 } from "util/vector3Functions";
import { DEFAULT_TICK } from "main";
import { unbreakableBlocks } from "block/blockUtils";
const ROAR_TIME = 20;
export function rollOgreRoar(caster, target, chance, canBreakBlocks = false) {
    if (!caster || !target) {
        return;
    }
    const isCaveOgre = caster.getComponent(EntityComponentTypes.Variant)?.value === 1
        ? true
        : false;
    const ROAR_COOLDOWN = "roarCooldown";
    const activationRange = 5; // min range to activate
    const cooldownTime = isCaveOgre ? 6 : 8;
    if (Math.random() > chance) {
        return;
    }
    const dimension = world.getDimension(caster.dimension.id);
    if (!dimension) {
        return;
    }
    function isEdge(x, y, z, distance) {
        const halfDistance = distance / 2;
        if (Math.abs(x) === halfDistance && Math.abs(y) === halfDistance) {
            return true;
        }
        if (Math.abs(x) === halfDistance && Math.abs(z) === halfDistance) {
            return true;
        }
        if (Math.abs(y) === halfDistance && Math.abs(z) === halfDistance) {
            return true;
        }
        return false;
    }
    const cooldown = caster.getDynamicProperty(ROAR_COOLDOWN);
    if (!!cooldown &&
        typeof cooldown == "number" &&
        system.currentTick - cooldown < cooldownTime * DEFAULT_TICK) {
        return;
    }
    if (distVector3(caster.location, target.location) > activationRange) {
        return;
    }
    caster.setDynamicProperty(ROAR_COOLDOWN, system.currentTick);
    // actually roar
    if (isCaveOgre) {
        caster.triggerEvent("minere:cave_ogre_start_roar");
    }
    else {
        caster.triggerEvent("minere:ogre_start_roar");
    }
    if (canBreakBlocks) {
        if (dimension.id === "minecraft:overworld" && caster.location.y > 63) {
            return;
        }
        if (caster.isInWater) {
            return;
        }
        system.runTimeout(() => {
            if (!caster?.isValid()) {
                return;
            }
            const breakDistance = isCaveOgre ? 6 : 5;
            const verticalBreakDistance = isCaveOgre ? 4 : 3;
            for (let x = breakDistance / -2; x <= breakDistance / 2; x += 0.5) {
                for (let y = 0; y <= verticalBreakDistance; y++) {
                    for (let z = breakDistance / -2; z <= breakDistance / 2; z += 0.5) {
                        const pos = {
                            x: caster.location.x + x,
                            y: caster.location.y + y,
                            z: caster.location.z + z,
                        };
                        if (pos.y >= dimension.heightRange.max ||
                            pos.y <= dimension.heightRange.min) {
                            continue;
                        }
                        if (isEdge(x, y, z, breakDistance)) {
                            continue;
                        }
                        const block = dimension.getBlock(pos);
                        if (!block?.isValid()) {
                            continue;
                        }
                        if (unbreakableBlocks.has(block.typeId)) {
                            continue;
                        }
                        dimension.runCommand(`setBlock ${pos.x} ${pos.y} ${pos.z} air destroy`);
                    }
                }
            }
        }, ROAR_TIME);
    }
}
