import {
  Entity,
  EntityDamageCause,
  EntityHurtAfterEvent,
  EntityRemoveBeforeEvent,
  EntitySpawnAfterEvent,
  system,
} from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { applyBombDamageBonus } from "entities/functions/applyDamageBonus";
import { isAlive } from "entities/utilities/common";
import { spawnParticleCloud } from "particles/particleCloud";

const POISON_BOMB_TYPE_ID = "minere:poison_bomb";
const FUSE_SOUND_ID = "random.fuse";
const POISON_DURATION = 20 * 10;
const POISON_RADIUS = 4;
const POISON_EFFECT_RADIUS = 5;
const POISON_CLOUD_PARTICLE = "minere:poison_particle";

export class PoisonBomb extends BaseCustomEntity {
  constructor() {
    super(POISON_BOMB_TYPE_ID);
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
    target.addEffect("poison", POISON_DURATION, {
      amplifier: 0,
    });
  };

  onBeforeEntityRemove = (data: EntityRemoveBeforeEvent): void =>
    spawnPoisonCloud(data.removedEntity);
}

function spawnPoisonCloud(entity: Entity) {
  if (!entity?.isValid) {
    return;
  }

  const location = entity.location;
  const dimension = entity.dimension;

  for (let i = 0; i < 5; i++) {
    system.runTimeout(() => {
      spawnParticleCloud(
        POISON_CLOUD_PARTICLE,
        location,
        POISON_RADIUS,
        18,
        dimension,
      );
      const entities = dimension.getEntities({
        location,
        maxDistance: POISON_EFFECT_RADIUS,
      });
      for (const nearby of entities) {
        if (!isAlive(nearby)) {
          continue;
        }
        if (nearby.typeId === POISON_BOMB_TYPE_ID) {
          continue;
        }
        nearby.addEffect("poison", POISON_DURATION, {
          amplifier: 0,
        });
      }
    }, i * 6);
  }
}
