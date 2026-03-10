import {
  EntityComponentTypes,
  EntityDamageCause,
  EntityEquippableComponent,
  EntityHurtAfterEvent,
  EquipmentSlot,
  Player,
  system,
} from "@minecraft/server";
import { spawnParticleCloud } from "particles/particleCloud";

const STRENGTH_DURATION = 20 * 10;
const FIRE_RESISTANCE_DURATION = 20 * 15;
const REGENERATION_DURATION = 20 * 5;
const INFERNO_CROWN_ITEM_ID = "minere:inferno_crown";
const INFERNO_CROWN_COOLDOWN_PROPERTY = "minere:inferno_crown_cooldown";
const INFERNO_CROWN_COOLDOWN_TICKS = 20 * 20;

export function infernoCrownOnEntityHurt(data: EntityHurtAfterEvent) {
  const player = data.hurtEntity;
  if (!(player instanceof Player)) {
    return;
  }

  if (
    data.damageSource.cause !== EntityDamageCause.fire &&
    data.damageSource.cause !== EntityDamageCause.lava &&
    data.damageSource.cause !== EntityDamageCause.fireTick
  ) {
    return;
  }

  const equippable = player.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;
  if (!equippable) {
    return;
  }

  const helmet = equippable.getEquipment(EquipmentSlot.Head);
  if (helmet?.typeId !== INFERNO_CROWN_ITEM_ID) {
    return;
  }
  if (
    isPlayerOnCooldown(
      player,
      INFERNO_CROWN_COOLDOWN_PROPERTY,
      INFERNO_CROWN_COOLDOWN_TICKS,
    )
  ) {
    return;
  }
  player.setDynamicProperty(INFERNO_CROWN_COOLDOWN_PROPERTY, system.currentTick);
  player.addEffect("strength", STRENGTH_DURATION, { amplifier: 1 });
  player.addEffect("regeneration", REGENERATION_DURATION, { amplifier: 1 });
  player.addEffect("fire_resistance", FIRE_RESISTANCE_DURATION);
  player.dimension.playSound("item.fire_staff.cast", player.location);
  player.sendMessage({
    translate: "info.minere:inferno_helmet.activate",
  });
  spawnParticleCloud(
    "minecraft:basic_flame_particle",
    player.location,
    3,
    25,
    player.dimension,
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
