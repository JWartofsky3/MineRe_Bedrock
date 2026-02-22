import {
  EntityDamageCause,
  EntityHurtAfterEvent,
  EntitySpawnAfterEvent,
} from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { applyBombDamageBonus } from "entities/functions/applyDamageBonus";
import { isAlive } from "entities/utilities/common";

const FIRE_BOMB_TYPE_ID = "minere:firebomb";
const FUSE_SOUND_ID = "random.fuse";

export class FireBomb extends BaseCustomEntity {
  constructor() {
    super(FIRE_BOMB_TYPE_ID);
  }

  onEntitySpawn = (data: EntitySpawnAfterEvent): void => {
    const entity = data.entity;
    if (!entity?.isValid) {
      return;
    }
    entity.dimension.playSound(FUSE_SOUND_ID, entity.location);
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
    target.setOnFire(5);
  };
}
