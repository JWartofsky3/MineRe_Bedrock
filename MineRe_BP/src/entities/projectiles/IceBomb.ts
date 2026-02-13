import {
  Dimension,
  Entity,
  EntityHurtAfterEvent,
  EntityRemoveBeforeEvent,
  EntitySpawnAfterEvent,
  system,
  world,
} from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { applyBombDamageBonus } from "entities/functions/applyDamageBonus";
import { freezeArea } from "functions/freezeArea";
import { freezeEntity, rollFreeze } from "entities/functions/freeze";
import { isAlive } from "entities/utilities/common";
import { spawnParticleCloud } from "particles/particleCloud";
import { distVector3 } from "util/vector3Functions";

const ICE_BOMB_TYPE_ID = "minere:ice_bomb";
const FUSE_SOUND_ID = "random.fuse";
const DURATION = 16;
const RADIUS = 6;
const FREEZE_AREA_OPTIONS = {
  radius: RADIUS,
  verticalRadius: RADIUS,
  coverWithSnow: true,
  ticksPerStep: 1,
  playSound: true,
};

export class IceBomb extends BaseCustomEntity {
  constructor() {
    super(ICE_BOMB_TYPE_ID);
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
    iceBombBurst(data.removedEntity);
}

function iceBombBurst(entity: Entity) {
  if (!entity?.isValid) {
    return;
  }
  const dimension = entity.dimension;
  const location = entity.location;

  system.run(() => {
    freezeArea(dimension, location, FREEZE_AREA_OPTIONS);
    const entities = dimension.getEntities({
      location,
      maxDistance: RADIUS,
    });
    for (let i = 0; i < entities.length; i++) {
      const nearby = entities[i];
      if (!nearby) {
        continue;
      }
      const distance = distVector3(nearby.location, location);
      if (distance < RADIUS * 0.6) {
        freezeEntity(nearby, DURATION);
      } else {
        rollFreeze(nearby, 0.075);
      }
    }
    dimension.playSound("item.ice_charge.frost", location, { volume: 2.25 });
    spawnParticleCloud(
      "minere:ice_charge_particles",
      location,
      RADIUS,
      60,
      dimension,
    );
  });
}
