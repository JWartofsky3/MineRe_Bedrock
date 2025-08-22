import { world, system, EntityComponentTypes, EntityDamageCause, } from "@minecraft/server";
import { healFromItem } from "player/healFromItem";
import { playerHungerHeal } from "player/playerHungerHeal";
import { armorWeight } from "player/armorWeight";
import { armorCurve } from "player/armorCurve";
import { throwBy } from "mob/throwBy";
import { rollWebAttack } from "mob/shootWeb";
import { ogreLaugh } from "mob/ogreLaugh";
import { skeletonStrafe } from "mob/skeleton_strafe";
import { useAmethystStaff } from "item/amethyst_staff";
import { useEchoStaff } from "item/echo_staff";
import { angerEndermen } from "mob/angerEndermen";
import { enderRandomTeleport } from "mob/enderTeleport";
import { rollCastFire } from "mob/castFire";
import { rollBecomeBat, vampireHeal, vampireHurt } from "mob/vampire";
import { fireInfintyBowAfter } from "item/infinity_bow";
import { rollBecomeSummoner } from "mob/become_summoner";
import { bombDamage } from "item/bomb_damage";
import { useFireStaff } from "item/fire_staff";
import { useBlasterStaff } from "item/blaster_staff";
import { rollFreeze } from "mob/freeze";
import { offHandTreecapitate } from "item/treecapitator";
import { blockDropItem } from "block/blockDropItem";
import { onAxeUse, onShovelUse, onHoeUse } from "item/custom_tools";
import { runEarthquake } from "mob/earthquake";
import { rollOgreRoar } from "mob/ogreRoar";
import { rollLeap } from "mob/yetiLeap";
import { iceCharge, iceChargeRunner } from "item/ice_charge";
import { horseRemoveChest } from "mob/horseCleanup";
import { runEndStorms } from "weather/end_storm";
import { registerBlocks, registerItems } from "registry";
import { ARMOR_WEIGHT, giveOutSettingsBook, initializeWorldSettings, } from "settings";
import { replacePlaceholder } from "mob/replacePlaceholderEntities";
import { breakTorches } from "mob/breakTorches";
import { giveExtraXP } from "player/goldXP";
export const DEFAULT_TICK = 20;
system.beforeEvents.startup.subscribe(function (data) {
    registerItems(data);
    registerBlocks(data);
    initializeWorldSettings();
});
giveOutSettingsBook();
world.afterEvents.itemReleaseUse.subscribe(function (data) {
    fireInfintyBowAfter(data);
});
world.afterEvents.itemCompleteUse.subscribe(function (data) {
    healFromItem(data);
});
world.afterEvents.entityHealthChanged.subscribe(function (data) {
    playerHungerHeal(data);
});
world.afterEvents.playerBreakBlock.subscribe(function (data) {
    offHandTreecapitate(data);
    blockDropItem(data);
});
world.beforeEvents.entityRemove.subscribe(function (data) {
    angerEndermen(data);
});
world.afterEvents.projectileHitBlock.subscribe(function (data) {
    if (data.projectile.typeId === "minere:ice_charge") {
        iceCharge(data.dimension, data.location, 3);
    }
});
world.beforeEvents.itemUse.subscribe((data) => {
    useAmethystStaff(data);
    useEchoStaff(data);
    useFireStaff(data);
    useBlasterStaff(data);
});
world.afterEvents.playerInteractWithBlock.subscribe((data) => {
    onHoeUse(data.player, data.itemStack, data.block);
    onShovelUse(data.player, data.itemStack, data.block);
    onAxeUse(data.player, data.itemStack, data.block);
});
world.afterEvents.entityDie.subscribe(function (data) {
    ogreLaugh(data?.damageSource?.damagingEntity, data.deadEntity);
    giveExtraXP(data?.damageSource?.damagingEntity, data?.deadEntity);
    horseRemoveChest(data);
});
world.afterEvents.entitySpawn.subscribe(function (data) {
    if (!data?.entity?.isValid) {
        return;
    }
    const dimension = data?.entity?.dimension;
    if (!dimension) {
        return;
    }
    runEarthquake(data.entity);
    if (data.entity.typeId == "minere:bomb" ||
        data.entity.typeId == "minere:firebomb") {
        dimension.playSound("random.fuse", data.entity.location);
    }
    if (data.entity.typeId == "minere:ice_charge") {
        dimension.playSound("item.ice_charge.frost", data.entity.location);
    }
    if (data.entity.typeId == "minere:demon") {
        rollBecomeSummoner(data.entity, 0.2);
    }
    if (data.entity.typeId == "minecraft:arrow") {
        skeletonStrafe(data.entity, 0.5);
    }
    replacePlaceholder(data.entity, true);
    iceChargeRunner(data.entity);
});
world.afterEvents.entityLoad.subscribe(function (data) {
    replacePlaceholder(data.entity, false);
});
world.afterEvents.entityHurt.subscribe(function (data) {
    if (data?.hurtEntity === null) {
        return;
    }
    if (data?.damageSource === null) {
        return;
    }
    if (!data.hurtEntity.hasComponent(EntityComponentTypes.Health)) {
        return;
    }
    const projectile = data.damageSource?.damagingProjectile;
    const attacker = data.damageSource?.damagingEntity;
    const cause = data.damageSource?.cause;
    const target = data.hurtEntity;
    const dimension = world.getDimension(target.dimension.id);
    if (!dimension) {
        return;
    }
    if (target.typeId === "minecraft:player") {
        armorCurve(target, data.damage, data.damageSource);
    }
    if (attacker?.typeId === "minere:bomb" ||
        attacker?.typeId == "minere:firebomb") {
        bombDamage(data?.hurtEntity, data?.damage, data?.damageSource);
    }
    // creaking damage
    if (attacker?.typeId === "minecraft:creaking") {
        if (Math.random() < 0.5) {
            target.addEffect("wither", 80);
        }
    }
    // throwing
    if ((attacker?.typeId === "minere:yeti" ||
        attacker?.typeId === "minere:walker") &&
        cause === EntityDamageCause.entityAttack) {
        throwBy(attacker, target, 1.0, 1.0);
    }
    // yeti leap
    if (attacker?.typeId === "minere:yeti") {
        rollLeap(attacker, target, 3, 24, 1, 1, 20, 6, 0.4, 0.2);
    }
    if (target?.typeId === "minere:yeti") {
        rollLeap(target, attacker, 3, 24, 1, 1, 20, 6, 0.4, 0.2);
    }
    // web spider shooting webs
    if (attacker?.typeId === "minere:web_spider" &&
        target?.typeId === "minecraft:player") {
        rollWebAttack(attacker, target, 0.6);
    }
    if (target?.typeId === "minere:web_spider" &&
        attacker?.typeId === "minecraft:player") {
        rollWebAttack(target, attacker, 0.4);
    }
    // demon shooting fire
    if (attacker?.typeId === "minere:demon") {
        rollCastFire(attacker, target, 0.25, 100);
    }
    if (target?.typeId === "minere:demon") {
        if (projectile) {
            rollCastFire(target, attacker, 0.33, 100);
            rollBecomeSummoner(target, 0.33);
        }
        else {
            rollCastFire(target, attacker, 0.25, 100);
            rollBecomeSummoner(target, 0.2);
        }
    }
    // ogre roar
    if (attacker?.typeId === "minere:ogre") {
        rollOgreRoar(attacker, target, 0.25, target?.typeId === "minecraft:player");
    }
    if (target?.typeId === "minere:ogre") {
        rollOgreRoar(target, attacker, 0.25, attacker?.typeId === "minecraft:player");
    }
    // freeze freezing
    if (attacker?.typeId === "minere:freeze") {
        rollFreeze(target, attacker);
    }
    if (projectile?.typeId === "minere:ice_charge") {
        rollFreeze(target, attacker, 0.075);
    }
    // ender phantom teleport target
    if (attacker?.typeId === "minere:ender_phantom") {
        enderRandomTeleport(target, 7, 0.35, 0);
    }
    // ender phantom teleport self
    if (target?.typeId === "minere:ender_phantom") {
        enderRandomTeleport(target, 40, 0.35, 4);
    }
    // enderman teleport target
    if (attacker?.typeId === "minecraft:enderman") {
        enderRandomTeleport(target, 5, 0.25, 0);
    }
    // ender dragon teleport target
    if (attacker?.typeId === "minecraft:ender_dragon" && !projectile) {
        enderRandomTeleport(target, 7, 0.5, 0);
    }
    if (attacker?.typeId === "minere:vampire") {
        vampireHeal(attacker, target);
    }
    if (target?.typeId === "minere:vampire" || target.typeId == "minere:ghost") {
        vampireHurt(target, attacker);
        if ((!!projectile || !!attacker) && target?.typeId === "minere:vampire") {
            rollBecomeBat(target, 0.25, 0.5);
        }
    }
});
world.afterEvents.dataDrivenEntityTrigger.subscribe((data) => {
    if (data.eventId === "minere:break_torches") {
        breakTorches(data.entity, 2);
    }
});
system.runInterval(() => {
    if (!world?.getDynamicProperty(ARMOR_WEIGHT)?.valueOf()) {
        return;
    }
    world.getAllPlayers().forEach((player) => {
        armorWeight(player);
    });
}, 1);
runEndStorms();
