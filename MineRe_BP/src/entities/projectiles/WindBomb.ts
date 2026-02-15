import {
  Entity,
  EntityHurtAfterEvent,
  EntitySpawnAfterEvent,
  EntityRemoveBeforeEvent,
  system,
} from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { applyBombDamageBonus } from "entities/functions/applyDamageBonus";
import { throwEntity } from "entities/functions/throw";
import { isAlive } from "entities/utilities/common";
import { spawnParticleCloud } from "particles/particleCloud";
import { distVector3 } from "util/vector3Functions";

const WIND_BOMB_TYPE_ID = "minere:wind_bomb";
const FUSE_SOUND_ID = "random.fuse";
const MAX_RADIUS = 8;
const BASE_FORCE = 8;
const BASE_VERTICAL = 3;

export class WindBomb extends BaseCustomEntity {
  constructor() {
    super(WIND_BOMB_TYPE_ID);
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
    applyBombDamageBonus(target, data.damage, data.damageSource);
  };

  onBeforeEntityRemove = (data: EntityRemoveBeforeEvent): void =>
    windBombBurst(data.removedEntity);
}

function windBombBurst(entity: Entity) {
  if (!entity?.isValid) {
    return;
  }
  const location = entity.location;
  const dimension = entity.dimension;

  system.run(() => {
    const entities = dimension.getEntities({
      location,
      maxDistance: MAX_RADIUS,
    });

    for (const nearby of entities) {
      if (!nearby) {
        continue;
      }

      const distance = distVector3(nearby.location, location);
      const distanceScale = Math.max(0.33, 1 - distance / MAX_RADIUS);

      try {
        throwEntity(
          location,
          nearby,
          BASE_FORCE * distanceScale,
          BASE_VERTICAL * distanceScale,
        );

        dimension.spawnParticle(
          "minecraft:wind_charged_emitter",
          nearby.location,
        );
        dimension.playSound("wind_charge.burst", nearby.location);
      } catch (err) {
        // ignore
      }
    }

    dimension.playSound("breeze_wind_charge.burst", location, {
      volume: 2.25,
    });

    spawnParticleCloud(
      "minecraft:wind_explosion_emitter",
      location,
      MAX_RADIUS / 3,
      5,
      dimension,
    );

    system.runTimeout(() => {
      spawnParticleCloud(
        "minecraft:wind_explosion_emitter",
        location,
        MAX_RADIUS,
        25,
        dimension,
      );
    }, 3);
  });
}
