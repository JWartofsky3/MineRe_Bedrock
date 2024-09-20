import { EntityComponentTypes } from "@minecraft/server";
export function bombDamage(entity, damage, damageSource) {
  const health = entity?.getComponent(EntityComponentTypes.Health);
  if (!health) {
    return;
  }
  if (entity.typeId === "minecraft:player") {
    entity.applyDamage(damage * 1.5, {
      cause: damageSource?.cause,
      damagingProjectile: damageSource?.damagingProjectile,
    });
  } else {
    entity.applyDamage(damage * 2.0, {
      cause: damageSource?.cause,
      damagingProjectile: damageSource?.damagingProjectile,
    });
  }
}
