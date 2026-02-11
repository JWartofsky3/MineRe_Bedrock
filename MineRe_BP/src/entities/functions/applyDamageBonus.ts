import {
  Entity,
  EntityComponentTypes,
  EntityDamageSource,
  EntityEquippableComponent,
  EntityHealthComponent,
  EquipmentSlot,
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
  const multiplier = maxHealth / 180 + 17 / 9;
  return Math.max(1.5, Math.min(4, multiplier));
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

  entity?.applyDamage(finalDamage, damageSource);
}
