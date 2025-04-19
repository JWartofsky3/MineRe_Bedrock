import { system, EntityComponentTypes, EquipmentSlot, } from "@minecraft/server";
import { isAlive } from "./mob_utils";
import { replaceableBlocks } from "block/blockUtils";
const MAX_SLOWNESS = 4;
const CANNOT_BE_FROZEN = new Set();
CANNOT_BE_FROZEN.add("minere:freeze");
CANNOT_BE_FROZEN.add("minere:monster_bat");
CANNOT_BE_FROZEN.add("minere:ghost");
CANNOT_BE_FROZEN.add("minere:walker");
CANNOT_BE_FROZEN.add("minere:cosmic_jelly");
CANNOT_BE_FROZEN.add("minecraft:vex");
CANNOT_BE_FROZEN.add("minecraft:bat");
CANNOT_BE_FROZEN.add("minecraft:ghast");
CANNOT_BE_FROZEN.add("minecraft:wither");
CANNOT_BE_FROZEN.add("minecraft:ender_dragon");
export function rollFreeze(target, attacker, bonus = 0) {
    if (!target || !attacker) {
        return;
    }
    if (!isAlive(target) || !isAlive(attacker)) {
        return false;
    }
    if (CANNOT_BE_FROZEN.has(target.typeId) || !target.isOnGround) {
        return;
    }
    const slownessEffect = target.getEffect("slowness");
    let slownessAmp = -1;
    if (slownessEffect) {
        slownessAmp = slownessEffect.amplifier;
    }
    const equipment = target.getComponent(EntityComponentTypes.Equippable);
    const hasLeather = equipment
        ?.getEquipmentSlot(EquipmentSlot.Chest)
        ?.getItem()
        ?.typeId.includes("leather") ?? false;
    const targetSlowness = Math.min(slownessAmp + (hasLeather ? 1 : 2), MAX_SLOWNESS);
    const snowChance = bonus + 0.25 + targetSlowness * 0.15;
    const iceChance = bonus + -0.1 + targetSlowness * 0.2;
    target.addEffect("slowness", 8 * 20, {
        amplifier: targetSlowness - 1,
    });
    if (Math.random() < iceChance) {
        freezeEntity(target, 16);
        return;
    }
    if (Math.random() < snowChance) {
        for (let i = 0; i < 2; i++) {
            system.runTimeout(() => {
                applySnow(target);
            }, 7 + i * 5);
        }
    }
}
export function freezeEntity(target, duration) {
    if (!target) {
        return;
    }
    const dimension = target.dimension;
    if (!dimension) {
        return;
    }
    if (CANNOT_BE_FROZEN.has(target.typeId)) {
        return;
    }
    target.addEffect("mining_fatigue", 80, {
        amplifier: 0,
    });
    if (dimension.id.includes("nether")) {
        dimension.spawnParticle("minere:big_smoke", target.location);
        dimension.playSound("extinguish.fire", target.location);
        return;
    }
    const location = {
        x: Math.round(target.location.x),
        y: Math.round(target.location.y),
        z: Math.round(target.location.z),
    };
    dimension.playSound("mob.freeze.freeze", target?.location);
    for (let i = -1; i < 3; i++) {
        system.runTimeout(() => {
            replaceableBlocks.forEach((replaceMe) => {
                dimension.runCommand(`fill ${location.x - 1} ${location.y + i} ${location.z - 1} ${location.x + 1} ${location.y + i} ${location.z + 1} minere:freeze_ice replace ${replaceMe}`);
            });
            if (i == 0 || i == 1) {
                dimension.runCommand(`fill ${location.x} ${location.y + i} ${location.z} ${location.x} ${location.y + i} ${location.z} ${i === 0 ? "powder_snow" : "air"} replace minere:freeze_ice`);
            }
            if (i == 0) {
                target.teleport({
                    x: location.x + 0.5,
                    y: location.y,
                    z: location.z + 0.5,
                });
            }
        }, 3 + i * 3);
    }
    //cleanup
    system.runTimeout(() => {
        for (let i = -1; i < 3; i++) {
            system.runTimeout(() => {
                dimension.runCommand(`fill ${location.x - 1} ${location.y + i} ${location.z - 1} ${location.x + 1} ${location.y + i} ${location.z + 1} air replace minere:freeze_ice`);
                if (i == 0) {
                    dimension.runCommand(`fill ${location.x} ${location.y + i} ${location.z} ${location.x} ${location.y + i} ${location.z} air replace powder_snow`);
                }
            }, 12 - i * 3);
        }
    }, duration * 20);
}
function applySnow(entity) {
    if (!entity) {
        return;
    }
    const dimension = entity.dimension;
    const location = entity.location;
    if (entity.location.y < dimension.heightRange.min ||
        location.y > dimension.heightRange.max) {
        return;
    }
    let isSnow = false;
    const block = dimension.getBlock(location);
    if (block?.typeId === "minecraft:snow_layer") {
        isSnow = true;
    }
    else {
        if (block && !block.isAir) {
            return;
        }
    }
    dimension.runCommand(`fill ${location.x} ${location.y} ${location.z} ${location.x} ${location.y} ${location.z} powder_snow replace ${isSnow ? "snow_layer" : "air"}`);
    system.runTimeout(() => {
        dimension.runCommand(`fill ${location.x} ${location.y} ${location.z} ${location.x} ${location.y} ${location.z} ${isSnow ? "snow_layer" : "air"} replace powder_snow`);
    }, 150);
}
