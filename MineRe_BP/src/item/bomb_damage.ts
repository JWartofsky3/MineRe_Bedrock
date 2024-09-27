import {
  Entity,
  EntityComponentTypes,
  EntityDamageSource,
  EntityHealthComponent,
  EntityProjectileComponent,
} from "@minecraft/server";

export function bombDamage(
  entity: Entity,
  damage: number,
  damageSource: EntityDamageSource,
) {
  const health = entity?.getComponent(
    EntityComponentTypes.Health,
  ) as EntityHealthComponent;
  if (!health) {
    return;
  }
  const proj = damageSource.damagingProjectile?.getComponent(
    EntityComponentTypes.Projectile,
  ) as EntityProjectileComponent;
  if (entity.typeId === "minecraft:player") {
    entity.applyDamage(damage * 1.5, {
      cause: damageSource?.cause,
      damagingEntity: proj?.owner,
      damagingProjectile: damageSource?.damagingProjectile,
    });
  } else {
    entity.applyDamage(damage * 2.0, {
      cause: damageSource?.cause,
      damagingEntity: proj?.owner,
      damagingProjectile: damageSource?.damagingProjectile,
    });
  }
}
