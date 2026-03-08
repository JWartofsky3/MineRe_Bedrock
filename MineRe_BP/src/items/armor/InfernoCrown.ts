import {
  world,
  EntityComponentTypes,
  EntityDamageCause,
  EntityEquippableComponent,
  EntityHurtAfterEvent,
  EquipmentSlot,
  ItemComponentTypes,
  ItemCooldownComponent,
  Player,
} from "@minecraft/server";
import { spawnParticleCloud } from "particles/particleCloud";

const STRENGTH_DURATION = 20 * 10;
const FIRE_RESISTANCE_DURATION = 20 * 15;
const REGENERATION_DURATION = 20 * 5;
const INFERNO_CROWN_ITEM_ID = "minere:inferno_crown";

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

  const cooldown = helmet.getComponent(
    ItemComponentTypes.Cooldown,
  ) as ItemCooldownComponent;
  if (cooldown.getCooldownTicksRemaining(player) !== 0) {
    return;
  }

  cooldown.startCooldown(player);
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
