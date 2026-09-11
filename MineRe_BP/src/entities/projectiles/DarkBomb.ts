import {
  EntityComponentTypes,
  EntityDamageCause,
  EntityHurtAfterEvent,
  EntityProjectileComponent,
  EntityRemoveBeforeEvent,
  EntitySpawnAfterEvent,
  system,
} from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { applyBombDamageBonus } from "entities/functions/applyDamageBonus";
import { triggerDarkChargeEffect } from "entities/projectiles/DarkCharge";
import { isAlive } from "entities/utilities/common";

const DARK_BOMB_TYPE_ID = "minere:dark_bomb";
const FUSE_SOUND_ID = "random.fuse";
const DARK_BOMB_RADIUS = 7;
const DARK_BOMB_VERTICAL_RADIUS = 3;

export class DarkBomb extends BaseCustomEntity {
  constructor() {
    super(DARK_BOMB_TYPE_ID);
  }

  onEntitySpawn = (data: EntitySpawnAfterEvent): void => {
    const entity = data.entity;
    if (entity?.isValid) {
      entity.dimension.playSound(FUSE_SOUND_ID, entity.location);
    }
  };

  onEntityHurtEntity = (data: EntityHurtAfterEvent): void => {
    const target = data.hurtEntity;
    if (!isAlive(target)) {
      return;
    }
    applyBombDamageBonus(target, data.damage, {
      damagingProjectile: data.damageSource?.damagingProjectile,
      damagingEntity: undefined,
      cause: EntityDamageCause.entityExplosion,
    });
  };

  onBeforeEntityRemove = (data: EntityRemoveBeforeEvent): void => {
    const entity = data.removedEntity;
    if (!entity?.isValid) {
      return;
    }
    const location = { ...entity.location };
    const dimension = entity.dimension;
    const projectile = entity.getComponent(
      EntityComponentTypes.Projectile,
    ) as EntityProjectileComponent | undefined;
    const ownerId = projectile?.owner?.id;

    system.run(() =>
      triggerDarkChargeEffect(dimension, location, ownerId, true, 2, {
        radius: DARK_BOMB_RADIUS,
        verticalRadius: DARK_BOMB_VERTICAL_RADIUS,
      }),
    );
  };
}
