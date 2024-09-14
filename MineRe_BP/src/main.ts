import {
  world,
  Entity,
  system,
  EntityComponentTypes,
  Player,
} from "@minecraft/server";
import { healFromItem } from "player/healFromItem";
import { playerHungerHeal } from "player/playerHungerHeal";
import { armorWeight } from "player/armorWeight";
import { armorCurve } from "player/armorCurve";
import { throwBy } from "mob/throwBy";
import { rollWebAttack } from "mob/shootWeb";
import { ogreLaugh } from "mob/ogreLaugh";
import { useAmethystStaff } from "item/amethyst_staff";
import { useEchoStaff } from "item/echo_staff";
import { usePhasedEnderPearl } from "item/phased_ender_pearl";
import { replaceMinecart } from "item/replace_minecart";
import { angerEndermen } from "mob/angerEndermen";
import { enderRandomTeleport } from "mob/enderTeleport";
import { handleEndSpawn } from "mob/endSpawns";
import { rollCastFire } from "mob/castFire";
import { rollBecomeBat, vampireHeal, vampireHurt } from "mob/vampire";
import { fireInfintyBowAfter } from "item/infinity_bow";
import { rollBecomeSummoner } from "mob/become_summoner";
import { bombDamage } from "item/bomb_damage";
import { handleItemDurability } from "item/handle_item_durability";
import { onHoeUse } from "item/custom_hoe";
import { useFireStaff } from "item/fire_staff";
import { useBlasterStaff } from "item/blaster_staff";

export const DEFAULT_TICK = 20;

world.afterEvents.itemReleaseUse.subscribe(function (data) {
  fireInfintyBowAfter(data);
});

world.afterEvents.itemCompleteUse.subscribe(function (data) {
  healFromItem(data);
  //runBuildPyramid(data);
});

world.afterEvents.entityHealthChanged.subscribe(function (data) {
  playerHungerHeal(data);
});

world.beforeEvents.entityRemove.subscribe(function (data) {
  angerEndermen(data);
  replaceMinecart(data);
});

world.beforeEvents.itemUse.subscribe((data) => {
  useAmethystStaff(data);
  useEchoStaff(data);
  useFireStaff(data);
  useBlasterStaff(data);
});

world.afterEvents.itemUse.subscribe((data) => {
  usePhasedEnderPearl(data);
});

world.afterEvents.itemUseOn.subscribe((data) => {
  onHoeUse(data.source, data.itemStack, data.block);
});

world.afterEvents.entityDie.subscribe(function (data) {
  ogreLaugh(data?.damageSource?.damagingEntity);
});

world.afterEvents.entitySpawn.subscribe(function (data) {
  if (data?.entity == null) {
    return;
  }
  if (data.entity.typeId == "minere:bomb") {
    world.playSound("random.fuse", data.entity.location);
  }
  if (data.entity.typeId == "minere:demon") {
    rollBecomeSummoner(data.entity, 0.2);
  }
  handleEndSpawn(data.entity);
});

world.afterEvents.playerBreakBlock.subscribe(function (data) {
  if (data.player === null) {
    return;
  }
  handleItemDurability(
    data.player,
    data.block,
    data.itemStackBeforeBreak,
    data.itemStackAfterBreak,
  );
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

  const projectile = data.damageSource?.damagingEntity;
  const attacker = data.damageSource?.damagingEntity;
  const target = data.hurtEntity;
  const dimension = world.getDimension(target.dimension.id);
  if (!dimension) {
    return;
  }

  if (target.typeId === "minecraft:player") {
    armorCurve(target as Player, data.damage, data.damageSource);
  }

  if (attacker?.typeId === "minere:bomb") {
    bombDamage(data?.hurtEntity, data?.damage);
  }

  // throwing
  if (
    attacker?.typeId === "minere:yeti" ||
    attacker?.typeId === "minere:walker"
  ) {
    throwBy(attacker, target, 5, 10);
  }

  // web spider shooting webs
  if (attacker?.typeId === "minere:web_spider") {
    rollWebAttack(attacker, target, 0.6);
  }
  if (target?.typeId === "minere:web_spider") {
    rollWebAttack(target, attacker, 0.4);
  }

  // demon shooting fire
  if (attacker?.typeId === "minere:demon") {
    rollCastFire(attacker, target, 0.25);
  }
  if (target?.typeId === "minere:demon") {
    if (projectile) {
      rollCastFire(target, attacker, 0.33);
      rollBecomeSummoner(target, 0.33);
    } else {
      rollCastFire(target, attacker, 0.25);
      rollBecomeSummoner(target, 0.2);
    }
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

  // DISABLED because it's buggy
  // ender dragon teleport self
  // if (target?.typeId === "minecraft:ender_dragon") {
  //   if (target.hasComponent("minecraft:behavior.dragonlanding")) {
  //     enderTeleport(target, 100, 0.1, 8);
  //   } else {
  //     enderTeleport(target, 100, 0.25, 8);
  //   }
  // }

  // anger endermen
  if (
    target.typeId === "minecraft:ender_crystal" &&
    dimension.id == "minecraft:the_end"
  ) {
    const endermen = dimension.getEntities({
      type: "enderman",
      closest: 4,
      location: target.location,
      maxDistance: 100,
    }) as Entity[];
    endermen.forEach((enderman: Entity) => {
      enderman.triggerEvent("minecraft:become_angry");
      world.playSound("mob.endermen.scream", enderman.location, {
        volume: 5.0,
      });
    });
  }
});

system.runInterval(() => {
  world.getAllPlayers().forEach((player: Player) => {
    armorWeight(player);
  });
}, 1);
