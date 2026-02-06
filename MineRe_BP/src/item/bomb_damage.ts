import {
  Entity,
  EntityComponentTypes,
  EntityDamageSource,
  EntityHealthComponent,
  EntityProjectileComponent,
  world,
} from "@minecraft/server";
import { isAlive } from "mob/mob_utils";
import { throwBy, throwByPos } from "mob/throwBy";

/**
 * Calculates the damage multiplier based on max health.
 */
function damageMultiplier(maxHealth: number): number {
  const multiplier = maxHealth / 180 + 17 / 9;
  return Math.max(1.5, Math.min(4, multiplier));
}

/**
 * Applies bomb/explosive damage to an entity.
 */
export function bombDamage(
  entity: Entity,
  baseDamage: number,
  damageSource: EntityDamageSource,
) {
  if (!isAlive(entity)) {
    return;
  }
  const health = entity.getComponent(
    EntityComponentTypes.Health,
  ) as EntityHealthComponent;

  if (!health) return;

  const maxHealth = health.effectiveMax;

  const finalDamage =
    entity.typeId === "minecraft:player"
      ? baseDamage * 1.5
      : baseDamage * damageMultiplier(maxHealth);

  entity?.applyDamage(finalDamage, {
    cause: damageSource?.cause,
    damagingEntity: damageSource?.damagingEntity,
    damagingProjectile: damageSource?.damagingProjectile,
  });
}
