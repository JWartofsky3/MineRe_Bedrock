import { system, world, EntityComponentTypes, } from "@minecraft/server";
import { multiplyVector3Number } from "util/vector3Functions";
import { reduceDurability } from "./reduce_durability";
import { DEFAULT_TICK } from "main";
const AMETHYST_SHIELD_COOLDOWN = "amethystShieldCooldown";
const cooldownTime = 8;
export const useAmethystStaff = (data) => {
    const itemStack = data.itemStack;
    const source = data.source;
    const dimension = world.getDimension(source.dimension.id);
    if (itemStack.typeId == "minere:amethyst_staff") {
        system.run(() => {
            if (source.isSneaking) {
                const cooldown = source.getDynamicProperty(AMETHYST_SHIELD_COOLDOWN);
                if (!!cooldown &&
                    typeof cooldown == "number" &&
                    system.currentTick - cooldown < cooldownTime * DEFAULT_TICK) {
                    source.playSound("item.amethyst_staff.error");
                    return;
                }
                source.setDynamicProperty(AMETHYST_SHIELD_COOLDOWN, system.currentTick);
                if (!source.runCommand("clear @s[m=!c] amethyst_shard 0 4")
                    .successCount &&
                    source.getGameMode() !== "creative") {
                    return;
                }
                generateShield(source.location, dimension, 4, 90);
                reduceDurability(source, itemStack, 5);
            }
            else {
                if (!source.runCommand("clear @s[m=!c] amethyst_shard 0 1")
                    .successCount &&
                    source.getGameMode() !== "creative") {
                    return;
                }
                dimension.playSound("step.amethyst_block", source.location);
                let loc = {
                    x: source.location.x + source.getViewDirection().x * 1.5,
                    y: source.location.y + 1.5 + source.getViewDirection().y * 1.5,
                    z: source.location.z + source.getViewDirection().z * 1.5,
                };
                let fireball = source.dimension.spawnEntity("minere:amethyst_projectile", loc);
                const proj = fireball.getComponent(EntityComponentTypes.Projectile);
                proj.owner = source;
                fireball.setRotation({
                    x: -1 * source.getRotation().x,
                    y: -1 * source.getRotation().y,
                });
                fireball.applyImpulse(multiplyVector3Number(source.getViewDirection(), 2.55));
                if (source.getGameMode() === "creative") {
                    return;
                }
                reduceDurability(source, itemStack, 1);
            }
        });
    }
};
function generateShield(position, dimension, size, lifespan) {
    let insideSize = size - 1;
    let timeout = 0;
    for (let i = size; i >= -size; i--) {
        let thisI = i;
        system.runTimeout(() => {
            dimension.runCommand(`fill ${position.x - size} ${position.y + thisI} ${position.z - size} ${position.x + size} ${position.y + thisI} ${position.z + size} minere:amethyst_shield replace air`);
            dimension.runCommand(`fill ${position.x - size} ${position.y + thisI} ${position.z - size} ${position.x + size} ${position.y + thisI} ${position.z + size} minere:amethyst_shield replace tall_grass`);
            dimension.playSound("step.amethyst_block", {
                x: position.x,
                y: position.y + thisI,
                z: position.z,
            });
            if (Math.abs(thisI) != size) {
                dimension.runCommand(`fill ${position.x - insideSize} ${position.y + thisI} ${position.z - insideSize} ${position.x + insideSize} ${position.y + thisI} ${position.z + insideSize} air replace minere:amethyst_shield`);
            }
        }, timeout);
        timeout += 2;
    }
    system.runTimeout(() => {
        cleanupShield(position, dimension, size);
    }, lifespan);
}
function cleanupShield(position, dimension, size) {
    let timeout = 0;
    for (let i = size; i >= -size; i--) {
        let thisI = i;
        system.runTimeout(() => {
            dimension.runCommand(`fill ${position.x - size} ${position.y + thisI} ${position.z - size} ${position.x + size} ${position.y + thisI} ${position.z + size} air replace minere:amethyst_shield`);
            dimension.playSound("step.amethyst_block", {
                x: position.x,
                y: position.y + thisI,
                z: position.z,
            });
        }, timeout);
        timeout += 2;
    }
}
