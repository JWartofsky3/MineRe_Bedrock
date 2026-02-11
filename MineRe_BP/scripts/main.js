import { world, system } from "@minecraft/server";
// ───────────────────────── Imports: Registry / Settings ─────────────────────────
import { registerBlocks } from "registry/blockRegistry";
import { registerItems } from "registry/itemRegistry";
import { registerCustomEntities } from "registry/customEntityRegistry";
import { ARMOR_WEIGHT, giveOutSettingsBook, initializeWorldSettings, } from "settings";
// ───────────────────────── Imports: Player ─────────────────────────
import { healFromItem } from "player/healFromItem";
import { playerHungerHeal } from "player/playerHungerHeal";
import { armorWeight } from "player/armorWeight";
import { armorCurve } from "player/armorCurve";
import { giveExtraXP } from "player/goldXP";
// ───────────────────────── Imports: Items ─────────────────────────
import { useAmethystStaff } from "item/amethyst_staff";
import { useEchoStaff } from "item/echo_staff";
import { useFireStaff } from "item/fire_staff";
import { useBlasterStaff } from "item/blaster_staff";
import { fireInfintyBowAfter } from "item/infinity_bow";
import { offHandTreecapitate } from "item/treecapitator";
import { onAxeUse, onShovelUse, onHoeUse } from "item/custom_tools";
// ───────────────────────── Imports: Blocks ─────────────────────────
import { blockDropItem } from "block/blockDropItem";
// ───────────────────────── Imports: Mobs / AI ─────────────────────────
import { skeletonStrafe } from "mob/skeleton_strafe";
import { angerEndermen } from "mob/angerEndermen";
import { horseRemoveChest } from "mob/horseCleanup";
import { replacePlaceholder } from "mob/replacePlaceholderEntities";
import { matchParent } from "mob/matchParent";
// ───────────────────────── Imports: World / Weather ─────────────────────────
import { runEndStorms } from "weather/end_storm";
import { isAlive } from "mob/mob_utils";
import { useEmeraldStaff } from "item/emerald_staff";
import { enderRandomTeleport } from "entities/functions/enderTeleport";
// ───────────────────────── Constants ─────────────────────────
export const DEFAULT_TICK = 20;
// ───────────────────────── Startup ─────────────────────────
system.beforeEvents.startup.subscribe((data) => {
    registerItems(data);
    registerBlocks(data);
    registerCustomEntities();
    initializeWorldSettings();
});
giveOutSettingsBook();
// ───────────────────────── Item Events ─────────────────────────
world.afterEvents.itemReleaseUse.subscribe(fireInfintyBowAfter);
world.afterEvents.itemCompleteUse.subscribe(healFromItem);
world.beforeEvents.itemUse.subscribe((data) => {
    useAmethystStaff(data);
    useEchoStaff(data);
    useFireStaff(data);
    useBlasterStaff(data);
    useEmeraldStaff(data);
});
// ───────────────────────── Player Events ─────────────────────────
world.afterEvents.entityHealthChanged.subscribe(playerHungerHeal);
world.afterEvents.playerBreakBlock.subscribe((data) => {
    offHandTreecapitate(data);
    blockDropItem(data);
});
world.afterEvents.playerInteractWithBlock.subscribe((data) => {
    onHoeUse(data.player, data.itemStack, data.block);
    onShovelUse(data.player, data.itemStack, data.block);
    onAxeUse(data.player, data.itemStack, data.block);
});
// ───────────────────────── Entity Lifecycle ─────────────────────────
world.beforeEvents.entityRemove.subscribe((data) => {
    angerEndermen(data);
});
world.afterEvents.entitySpawn.subscribe((data) => {
    const entity = data.entity;
    if (!entity?.isValid)
        return;
    if (entity.typeId === "minecraft:arrow") {
        skeletonStrafe(entity, 0.5);
    }
    replacePlaceholder(entity, true);
    matchParent(entity);
});
world.afterEvents.entityLoad.subscribe((data) => {
    replacePlaceholder(data.entity, false);
});
world.afterEvents.entityDie.subscribe((data) => {
    giveExtraXP(data.damageSource?.damagingEntity, data.deadEntity);
    horseRemoveChest(data);
});
// ───────────────────────── Combat / Damage ─────────────────────────
world.afterEvents.entityHurt.subscribe((data) => {
    const target = data.hurtEntity;
    const source = data.damageSource;
    if (!target?.isValid || !source) {
        return;
    }
    if (!isAlive(target)) {
        return;
    }
    const attacker = source.damagingEntity;
    const projectile = source.damagingProjectile;
    if (target.typeId === "minecraft:player") {
        armorCurve(target, data.damage, source);
    }
    if (attacker?.typeId === "minecraft:creaking" && Math.random() < 0.5) {
        target.addEffect("wither", 80);
    }
    if (attacker?.typeId === "minecraft:enderman") {
        enderRandomTeleport(target, 5, 0.25, 0);
    }
    if (attacker?.typeId === "minecraft:ender_dragon" && !projectile) {
        enderRandomTeleport(target, 7, 0.5, 0);
    }
});
// ───────────────────────── Ticking Systems ─────────────────────────
system.runInterval(() => {
    if (!world.getDynamicProperty(ARMOR_WEIGHT)?.valueOf())
        return;
    world.getAllPlayers().forEach(armorWeight);
}, 1);
runEndStorms();
