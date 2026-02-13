import {
  Entity,
  EntityDamageCause,
  EntityHurtAfterEvent,
  EntitySpawnAfterEvent,
  ProjectileHitBlockAfterEvent,
  ProjectileHitEntityAfterEvent,
  system,
  world,
} from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { rollFreeze } from "entities/functions/freeze";
import { isFamily } from "entities/utilities/common";
import { freezeArea, FreezeAreaOptions } from "functions/freezeArea";
import { isAlive } from "mob/mob_utils";

const FROST_SOUND_ID = "item.ice_charge.frost";
const LIFESPAN_TICKS = 100;
const SPAWN_TICK_KEY = "minere:ice_charge_spawn_tick";
const FIRE_MOB_DAMAGE_MULTIPLIER = 2;

const FREEZE_AREA_OPTIONS: FreezeAreaOptions = {
  radius: 4,
  verticalRadius: 2,
  coverWithSnow: false,
  ticksPerStep: 3,
  playSound: true,
};

export class IceCharge extends BaseCustomEntity {
  constructor() {
    super("minere:ice_charge", 1);
  }

  onProjectileHitBlock(data: ProjectileHitBlockAfterEvent): void {
    freezeArea(data.dimension, data.location, FREEZE_AREA_OPTIONS);
  }

  onEntitySpawn = (data: EntitySpawnAfterEvent): void => {
    const entity = data.entity;
    if (!entity?.isValid) {
      return;
    }
    entity.dimension.playSound(FROST_SOUND_ID, entity.location);
    entity.setDynamicProperty(SPAWN_TICK_KEY, system.currentTick);
  };

  onTick = (entity: Entity): void => {
    if (!entity?.isValid) {
      return;
    }
    const spawnTick = entity.getDynamicProperty(SPAWN_TICK_KEY);
    if (typeof spawnTick === "number") {
      if (system.currentTick - spawnTick >= LIFESPAN_TICKS) {
        entity.remove();
        return;
      }
    }
    if (entity.isInWater) {
      freezeArea(entity.dimension, entity.location, FREEZE_AREA_OPTIONS);
      entity.remove();
    }
    const block = entity.dimension.getBlock(entity.location);
    if (
      block.typeId === "minecraft:lava" ||
      block.typeId === "minecraft:flowing_lava"
    ) {
      freezeArea(entity.dimension, entity.location, FREEZE_AREA_OPTIONS);
      entity.remove();
    }
  };

  onEntityHurtEntity(data: EntityHurtAfterEvent): void {
    const target = data.hurtEntity;
    if (!isAlive(target)) {
      return;
    }
    rollFreeze(target, 0.075);
    if (isFamily(target, "blaze") || isFamily(target, "inferno")) {
      target?.applyDamage(data.damage * FIRE_MOB_DAMAGE_MULTIPLIER, {
        damagingProjectile: data.damageSource.damagingProjectile,
        damagingEntity: data.damageSource.damagingEntity,
        cause: EntityDamageCause.freezing,
      });
    }
  }
}
