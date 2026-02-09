import { world, system, EntityDamageCause, } from "@minecraft/server";
// ───────────────────────── Imports: Registry / Settings ─────────────────────────
import { registerBlocks, registerItems } from "registry";
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
import { bombDamage } from "item/bomb_damage";
import { windBomb } from "item/wind_bomb";
import { iceCharge, iceChargeRunner } from "item/ice_charge";
import { iceBomb } from "item/ice_bomb";
import { offHandTreecapitate } from "item/treecapitator";
import { onAxeUse, onShovelUse, onHoeUse } from "item/custom_tools";
// ───────────────────────── Imports: Blocks ─────────────────────────
import { blockDropItem } from "block/blockDropItem";
// ───────────────────────── Imports: Mobs / AI ─────────────────────────
import { throwBy } from "mob/throwBy";
import { rollWebAttack } from "mob/shootWeb";
import { ogreLaugh } from "mob/ogreLaugh";
import { skeletonStrafe } from "mob/skeleton_strafe";
import { angerEndermen } from "mob/angerEndermen";
import { enderRandomTeleport } from "mob/enderTeleport";
import { rollCastFire } from "mob/castFire";
import { rollBecomeBat, vampireHeal, vampireHurt } from "mob/vampire";
import { rollBecomeSummoner } from "mob/become_summoner";
import { rollFreeze } from "mob/freeze";
import { runEarthquake } from "mob/earthquake";
import { rollOgreRoar } from "mob/ogreRoar";
import { rollLeap } from "mob/yetiLeap";
import { horseRemoveChest } from "mob/horseCleanup";
import { replacePlaceholder } from "mob/replacePlaceholderEntities";
import { breakTorches } from "mob/breakTorches";
import { matchParent } from "mob/matchParent";
// ───────────────────────── Imports: World / Weather ─────────────────────────
import { runEndStorms } from "weather/end_storm";
import { isAlive, isFamily } from "mob/mob_utils";
import { infernoOnHurtEntity, startInfernoRunners } from "boss/inferno";
import { useEmeraldStaff } from "item/emerald_staff";
// ───────────────────────── Constants ─────────────────────────
export const DEFAULT_TICK = 20;
const bombEntityIds = new Set([
    "minere:bomb",
    "minere:firebomb",
    "minere:wind_bomb",
    "minere:ice_bomb",
]);
// ───────────────────────── Startup ─────────────────────────
system.beforeEvents.startup.subscribe((data) => {
    registerItems(data);
    registerBlocks(data);
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
    windBomb(data);
    iceBomb(data);
});
world.afterEvents.entitySpawn.subscribe((data) => {
    const entity = data.entity;
    if (!entity?.isValid)
        return;
    startInfernoRunners(entity);
    const dimension = entity.dimension;
    runEarthquake(entity);
    if (bombEntityIds.has(entity.typeId)) {
        dimension.playSound("random.fuse", entity.location);
    }
    if (entity.typeId === "minere:ice_charge") {
        dimension.playSound("item.ice_charge.frost", entity.location);
    }
    if (entity.typeId === "minere:demon") {
        rollBecomeSummoner(entity, 0.2);
    }
    if (entity.typeId === "minecraft:arrow") {
        skeletonStrafe(entity, 0.5);
    }
    replacePlaceholder(entity, true);
    iceChargeRunner(entity);
    matchParent(entity);
});
world.afterEvents.entityLoad.subscribe((data) => {
    replacePlaceholder(data.entity, false);
    startInfernoRunners(data.entity);
});
world.afterEvents.entityDie.subscribe((data) => {
    ogreLaugh(data.damageSource?.damagingEntity, data.deadEntity);
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
    infernoOnHurtEntity(data);
    const attacker = source.damagingEntity;
    const projectile = source.damagingProjectile;
    const cause = source.cause;
    if (target.typeId === "minecraft:player") {
        armorCurve(target, data.damage, source);
    }
    if (bombEntityIds.has(attacker?.typeId)) {
        bombDamage(target, data.damage, source);
    }
    if (attacker?.typeId === "minecraft:creaking" && Math.random() < 0.5) {
        target.addEffect("wither", 80);
    }
    if ((attacker?.typeId === "minere:yeti" ||
        attacker?.typeId === "minere:walker") &&
        cause === EntityDamageCause.entityAttack) {
        throwBy(attacker, target, 1.25, 1.0);
    }
    if (attacker?.typeId === "minere:moose") {
        throwBy(attacker, target, 2.0, 0.5);
    }
    if (attacker?.typeId === "minere:yeti") {
        rollLeap(attacker, target, 3, 24, 1, 1, 20, 6, 0.4, 0.2);
    }
    if (target.typeId === "minere:yeti") {
        rollLeap(target, attacker, 3, 24, 1, 1, 20, 6, 0.4, 0.2);
    }
    if (attacker?.typeId === "minere:web_spider" &&
        target.typeId === "minecraft:player") {
        rollWebAttack(attacker, target, 0.6);
    }
    if (target.typeId === "minere:web_spider" &&
        attacker?.typeId === "minecraft:player") {
        rollWebAttack(target, attacker, 0.4);
    }
    if (attacker?.typeId === "minere:demon") {
        rollCastFire(attacker, target, 0.25, 100);
    }
    if (target.typeId === "minere:demon") {
        rollCastFire(target, attacker, projectile ? 0.33 : 0.25, 100);
        rollBecomeSummoner(target, projectile ? 0.33 : 0.2);
    }
    if (attacker?.typeId === "minere:ogre") {
        rollOgreRoar(attacker, target, 0.25, target.typeId === "minecraft:player");
    }
    if (target.typeId === "minere:ogre") {
        rollOgreRoar(target, attacker, 0.25, attacker?.typeId === "minecraft:player");
    }
    if (attacker?.typeId === "minere:freeze") {
        rollFreeze(target);
    }
    if (projectile?.typeId === "minere:ice_charge" ||
        attacker?.typeId === "minere:ice_charge") {
        rollFreeze(target, 0.075);
        if (isFamily(target, "blaze") || isFamily(target, "inferno")) {
            target?.applyDamage(data.damage * 2, data.damageSource);
        }
    }
    if (attacker?.typeId === "minere:ender_phantom") {
        enderRandomTeleport(target, 7, 0.35, 0);
    }
    if (target.typeId === "minere:ender_phantom") {
        enderRandomTeleport(target, 40, 0.35, 4);
    }
    if (attacker?.typeId === "minecraft:enderman") {
        enderRandomTeleport(target, 5, 0.25, 0);
    }
    if (attacker?.typeId === "minecraft:ender_dragon" && !projectile) {
        enderRandomTeleport(target, 7, 0.5, 0);
    }
    if (attacker?.typeId === "minere:vampire") {
        vampireHeal(attacker, target);
    }
    if (target.typeId === "minere:vampire" || target.typeId === "minere:ghost") {
        vampireHurt(target, attacker);
        if ((projectile || attacker) && target.typeId === "minere:vampire") {
            rollBecomeBat(target, 0.275, 0.5);
        }
    }
});
world.afterEvents.projectileHitBlock.subscribe((data) => {
    if (data.projectile.typeId === "minere:ice_charge") {
        iceCharge(data.dimension, data.location, 4);
    }
});
// ───────────────────────── Data-Driven Triggers ─────────────────────────
world.afterEvents.dataDrivenEntityTrigger.subscribe((data) => {
    if (data.eventId === "minere:break_torches") {
        breakTorches(data.entity, 2);
    }
});
// ───────────────────────── Ticking Systems ─────────────────────────
system.runInterval(() => {
    if (!world.getDynamicProperty(ARMOR_WEIGHT)?.valueOf())
        return;
    world.getAllPlayers().forEach(armorWeight);
}, 1);
runEndStorms();
