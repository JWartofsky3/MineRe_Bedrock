import { EntityComponentTypes, world, } from "@minecraft/server";
import { getMainItem } from "item/item_utils";
import { isFamily } from "mob/mob_utils";
import { GOLD_XP_BONUS } from "settings";
import { addVector3, randomVector3 } from "util/vector3Functions";
const GOLD = 0.5;
const COPPER = 0.1;
const XP_VERTICAL_VELOCITY = 0.02;
const XP_VELOCITY = 0.02;
const itemXPMap = new Map();
// GOLD
itemXPMap.set("minecraft:golden_sword", GOLD);
itemXPMap.set("minecraft:golden_pickaxe", GOLD);
itemXPMap.set("minecraft:golden_axe", GOLD);
itemXPMap.set("minecraft:golden_shovel", GOLD);
itemXPMap.set("minecraft:golden_hoe", GOLD);
itemXPMap.set("minere:golden_treecapitator", GOLD);
// COPPER
itemXPMap.set("minecraft:copper_sword", COPPER);
itemXPMap.set("minecraft:copper_pickaxe", COPPER);
itemXPMap.set("minecraft:copper_axe", COPPER);
itemXPMap.set("minecraft:copper_shovel", COPPER);
itemXPMap.set("minecraft:copper_hoe", COPPER);
itemXPMap.set("minere:copper_treecapitator", COPPER);
const xpMultiplierMap = new Map();
xpMultiplierMap.set("minecraft:ghast", 2.5);
xpMultiplierMap.set("minere:cosmic_jelly", 2.5);
const MAX_BONUS = 100;
export function giveExtraXP(source, entity) {
    if (!source || !source?.isValid || !entity || !entity?.isValid) {
        return;
    }
    if (source?.typeId !== "minecraft:player") {
        return;
    }
    if (!world?.getDynamicProperty(GOLD_XP_BONUS)?.valueOf()) {
        return;
    }
    const tool = getMainItem(source, { requireDurability: true });
    if (!tool) {
        return;
    }
    if (!isFamily(entity, "monster")) {
        return;
    }
    const health = entity.getComponent(EntityComponentTypes.Health);
    if (!health) {
        return;
    }
    const itemXPFactor = itemXPMap.get(tool.typeId);
    if (!itemXPFactor) {
        return;
    }
    const dimension = entity.dimension;
    const location = entity.location;
    const xpMultiplier = xpMultiplierMap.get(entity.typeId) ?? 1.0;
    const xp = Math.min(MAX_BONUS, Math.floor(health.effectiveMax * itemXPFactor * xpMultiplier));
    for (let i = 0; i < xp; i++) {
        const orb = dimension.spawnEntity("minecraft:xp_orb", location);
        orb.applyImpulse(addVector3(randomVector3(XP_VELOCITY), {
            x: 0,
            y: XP_VERTICAL_VELOCITY,
            z: 0,
        }));
    }
}
