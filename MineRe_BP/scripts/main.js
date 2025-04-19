import { world, system, EntityComponentTypes, } from "@minecraft/server";
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
import { PhasedEnderPearl } from "item/phased_ender_pearl";
import { angerEndermen } from "mob/angerEndermen";
import { enderRandomTeleport } from "mob/enderTeleport";
import { handleEndSpawn } from "mob/endSpawns";
import { rollCastFire } from "mob/castFire";
import { rollBecomeBat, vampireHeal, vampireHurt } from "mob/vampire";
import { fireInfintyBowAfter } from "item/infinity_bow";
import { rollBecomeSummoner } from "mob/become_summoner";
import { bombDamage } from "item/bomb_damage";
import { useFireStaff } from "item/fire_staff";
import { useBlasterStaff } from "item/blaster_staff";
import { EnderStrike } from "item/ender_strike";
import { rollFreeze } from "mob/freeze";
import { fireflyLamp } from "block/firefly_lamp";
import { IceDagger } from "item/ice_dagger";
import { VenomShank } from "item/venom_shank";
import { customOre } from "block/custom_ore";
import { teleporter } from "block/teleporter";
import { Treecapitator, offHandTreecapitate } from "item/treecapitator";
import { onAxeUse, onShovelUse, onHoeUse, CustomAxe, CustomSword, CustomShovel, CustomPickaxe, CustomHoe, } from "item/custom_tools";
import { RoyalJelly } from "item/royal_jelly";
import { runEarthquake } from "mob/earthquake";
import { rollOgreRoar } from "mob/ogreRoar";
import { rollLeap } from "mob/yetiLeap";
import { Illumina } from "item/illumina";
import { PlatformPath } from "item/platform_path";
import { iceCharge, iceChargeRunner } from "item/ice_charge";
import { ghostPot } from "block/ghost_pot";
import { Windforce } from "item/windforce";
import { Firebrand } from "item/firebrand";
import { Darkheart } from "item/darkheart";
import { horseRemoveChest } from "mob/horseCleanup";
export const DEFAULT_TICK = 20;
world.beforeEvents.worldInitialize.subscribe(function (data) {
    data.itemComponentRegistry.registerCustomComponent("minere:ender_strike", EnderStrike);
    data.itemComponentRegistry.registerCustomComponent("minere:illumina", Illumina);
    data.itemComponentRegistry.registerCustomComponent("minere:ice_dagger", IceDagger);
    data.itemComponentRegistry.registerCustomComponent("minere:venom_shank", VenomShank);
    data.itemComponentRegistry.registerCustomComponent("minere:windforce", Windforce);
    data.itemComponentRegistry.registerCustomComponent("minere:firebrand", Firebrand);
    data.itemComponentRegistry.registerCustomComponent("minere:darkheart", Darkheart);
    data.itemComponentRegistry.registerCustomComponent("minere:royal_jelly", RoyalJelly);
    data.itemComponentRegistry.registerCustomComponent("minere:custom_sword", CustomSword);
    data.itemComponentRegistry.registerCustomComponent("minere:custom_axe", CustomAxe);
    data.itemComponentRegistry.registerCustomComponent("minere:custom_hoe", CustomHoe);
    data.itemComponentRegistry.registerCustomComponent("minere:custom_shovel", CustomShovel);
    data.itemComponentRegistry.registerCustomComponent("minere:custom_pickaxe", CustomPickaxe);
    data.itemComponentRegistry.registerCustomComponent("minere:treecapitator", Treecapitator);
    data.itemComponentRegistry.registerCustomComponent("minere:path", PlatformPath);
    data.itemComponentRegistry.registerCustomComponent("minere:phased_ender_pearl", PhasedEnderPearl);
    data.blockComponentRegistry.registerCustomComponent("minere:firefly_lamp", fireflyLamp);
    data.blockComponentRegistry.registerCustomComponent("minere:custom_ore", customOre);
    data.blockComponentRegistry.registerCustomComponent("minere:teleporter", teleporter);
    data.blockComponentRegistry.registerCustomComponent("minere:ghost_pot", ghostPot);
});
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
world.afterEvents.itemUseOn.subscribe((data) => {
    onHoeUse(data.source, data.itemStack, data.block);
    onShovelUse(data.source, data.itemStack, data.block);
    onAxeUse(data.source, data.itemStack, data.block);
});
world.afterEvents.entityDie.subscribe(function (data) {
    ogreLaugh(data?.damageSource?.damagingEntity);
    horseRemoveChest(data);
});
world.afterEvents.entitySpawn.subscribe(function (data) {
    if (data?.entity == null) {
        return;
    }
    data.cause;
    runEarthquake(data.entity);
    if (data.entity.typeId == "minere:bomb" ||
        data.entity.typeId == "minere:firebomb") {
        world.playSound("random.fuse", data.entity.location);
    }
    if (data.entity.typeId == "minere:ice_charge") {
        world.playSound("item.ice_charge.frost", data.entity.location);
    }
    if (data.entity.typeId == "minere:demon") {
        rollBecomeSummoner(data.entity, 0.2);
    }
    if (data.entity.typeId == "minecraft:arrow") {
        skeletonStrafe(data.entity, 0.5);
    }
    handleEndSpawn(data.entity);
    iceChargeRunner(data.entity);
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
            target.addEffect("wither", 60);
        }
    }
    // throwing
    if (attacker?.typeId === "minere:yeti" ||
        attacker?.typeId === "minere:walker") {
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
            rollBecomeBat(target, 0.2, 0.5);
        }
    }
});
system.runInterval(() => {
    world.getAllPlayers().forEach((player) => {
        armorWeight(player);
    });
}, 1);
