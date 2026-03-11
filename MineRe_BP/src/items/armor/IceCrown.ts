import {
  Entity,
  EntityComponentTypes,
  EntityDamageCause,
  EntityEquippableComponent,
  EntityHurtAfterEvent,
  EquipmentSlot,
  Player,
  system,
} from "@minecraft/server";
import { isAlive } from "mob/mob_utils";
import { freezeArea } from "functions/freezeArea";

const ICE_CROWN_ITEM_ID = "minere:ice_crown";
const ICE_CROWN_COOLDOWN_PROPERTY = "minere:ice_crown_cooldown";
const ICE_CROWN_COOLDOWN_TICKS = 20 * 20;
const ICE_CROWN_MESSAGE = "info.minere:ice_crown.activate";
const ICE_CROWN_RADIUS = 5;
const ICE_CROWN_SLOWNESS_DURATION = 20 * 5;

const ICE_CROWN_FREEZE_OPTIONS = {
  radius: ICE_CROWN_RADIUS,
  verticalRadius: ICE_CROWN_RADIUS,
  coverWithSnow: true,
  ticksPerStep: 3,
  playSound: true,
};

export function iceCrownOnEntityHurt(data: EntityHurtAfterEvent) {
  const player = data.hurtEntity;
  if (!(player instanceof Player)) {
    return;
  }

  const equippable = player.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;
  if (!equippable) {
    return;
  }

  const helmet = equippable.getEquipment(EquipmentSlot.Head);
  if (helmet?.typeId !== ICE_CROWN_ITEM_ID) {
    return;
  }

  applyAttackerSlow(data.damageSource.damagingEntity);

  if (!isIceCrownTriggerCause(data.damageSource.cause)) {
    return;
  }

  if (
    isPlayerOnCooldown(
      player,
      ICE_CROWN_COOLDOWN_PROPERTY,
      ICE_CROWN_COOLDOWN_TICKS,
    )
  ) {
    return;
  }

  player.setDynamicProperty(ICE_CROWN_COOLDOWN_PROPERTY, system.currentTick);
  freezeArea(player.dimension, player.location, ICE_CROWN_FREEZE_OPTIONS);
  player.sendMessage({
    translate: ICE_CROWN_MESSAGE,
  });
  system.runTimeout(() => {
    player.extinguishFire();
    createSafePocket(player);
  }, 20);
}

function applyAttackerSlow(attacker?: Entity) {
  if (!attacker) {
    return;
  }
  if (!isAlive(attacker)) {
    return;
  }

  attacker.addEffect("slowness", ICE_CROWN_SLOWNESS_DURATION, {
    amplifier: 0,
  });
}

function isIceCrownTriggerCause(cause: EntityDamageCause): boolean {
  return (
    cause === EntityDamageCause.fire ||
    cause === EntityDamageCause.fireTick ||
    cause === EntityDamageCause.lava
  );
}

function isPlayerOnCooldown(
  player: Player,
  propertyId: string,
  cooldownTicks: number,
): boolean {
  const cooldown = player.getDynamicProperty(propertyId);

  return (
    typeof cooldown === "number" &&
    system.currentTick - cooldown < cooldownTicks
  );
}

function createSafePocket(player: Player) {
  const location = {
    x: Math.floor(player.location.x),
    y: Math.floor(player.location.y),
    z: Math.floor(player.location.z),
  };

  player.dimension.runCommand(
    `fill ${location.x - 1} ${location.y} ${location.z - 1} ${location.x + 1} ${location.y + 1} ${location.z + 1} air destroy`,
  );
  player.dimension.runCommand(
    `fill ${location.x - 2} ${location.y - 1} ${location.z - 2} ${location.x + 2} ${location.y + 2} ${location.z + 2} obsidian replace lava`,
  );
}
