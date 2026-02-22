import {
  Entity,
  EntityComponentTypes,
  EntityDamageSource,
  EntityEquippableComponent,
  EntityHealthComponent,
  EquipmentSlot,
  world,
} from "@minecraft/server";
import { getHealth, isAlive } from "entities/utilities/common";

export function applyToolDamageBonus(
  target: Entity,
  attacker: Entity,
  damageBonus: number,
  toolIdSubstring: string,
): void {
  if (!isAlive(target) || !isAlive(attacker)) {
    return;
  }
  const targetHealth = target.getComponent(
    EntityComponentTypes.Health,
  ) as EntityHealthComponent;
  const attackerEquippable = attacker.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;
  if (!attackerEquippable) {
    return;
  }
  const weapon = attackerEquippable.getEquipmentSlot(EquipmentSlot.Mainhand);
  if (!weapon.getItem()) {
    return;
  }
  if (weapon.typeId.toLowerCase().includes(toolIdSubstring)) {
    targetHealth.setCurrentValue(targetHealth.currentValue - damageBonus);
  }
}

/**
 * Calculates the damage multiplier based on max health.
 */
function bombDamageMultiplier(maxHealth: number): number {
  const multiplier = maxHealth / 75 + 1.0;
  return Math.max(1.5, Math.min(3, multiplier));
}

/**
 * Applies bomb/explosive damage to an entity.
 */
export function applyBombDamageBonus(
  entity: Entity,
  baseDamage: number,
  damageSource?: EntityDamageSource,
) {
  if (!isAlive(entity)) {
    return;
  }
  const health = getHealth(entity);
  if (!health) return;

  const maxHealth = health.effectiveMax;

  const finalDamage =
    entity.typeId === "minecraft:player"
      ? baseDamage * 1.5
      : baseDamage * bombDamageMultiplier(maxHealth);

  world.sendMessage(
    `final damage is ${finalDamage} to targe ${entity?.typeId} from source ${damageSource}`,
  );

  entity?.applyDamage(finalDamage, damageSource);
}

export function getScaledDamage(
  distance: number,
  range: number,
  minDamage: number,
  maxDamage: number,
  maxDamageRangePercent: number, // e.g. 0.5 = first 50% of range is full damage
): number {
  if (range <= 0) {
    return maxDamage;
  }

  const clampedDistance = Math.max(0, Math.min(distance, range));
  const clampedPercent = Math.max(0, Math.min(maxDamageRangePercent, 1));
  const maxDamageDistance = range * clampedPercent;

  if (clampedDistance <= maxDamageDistance) {
    return maxDamage;
  }

  const falloffDistance = range - maxDamageDistance;
  if (falloffDistance <= 0) {
    return minDamage;
  }

  const falloffT = (clampedDistance - maxDamageDistance) / falloffDistance;
  return maxDamage - (maxDamage - minDamage) * falloffT;
}
