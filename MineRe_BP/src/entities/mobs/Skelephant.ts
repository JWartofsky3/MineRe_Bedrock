import {
  Entity,
  EntityComponentTypes,
  EntityDamageCause,
  EntityDamageSource,
  EntityRideableComponent,
  EntitySpawnAfterEvent,
  EntityTypeFamilyComponent,
  EntityHurtAfterEvent,
  system,
  world,
} from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { applyBombDamageBonus, getScaledDamage } from "entities/functions/applyDamageBonus";
import { isOffCooldown } from "entities/functions/checkCooldown";
import { isAlive, isUnderground } from "mob/mob_utils";
import { distVector3 } from "util/vector3Functions";
import { throwEntity } from "entities/functions/throw";

const TYPE_ID = "minere:skelephant";
const STOMP_COOLDOWN = 20 * 8;
const STOMP_CHANCE = 0.15;
const STOMP_ACTIVATION_RANGE = 8;
const STOMP_DAMAGE_RANGE = 5;
const STOMP_DAMAGE_MIN = 6;
const STOMP_DAMAGE_MAX = 16;
const STOMP_COOLDOWN_PROPERTY_ID = "minere:skelephant_stomp_cooldown";
const SINKING_PROPERTY_ID = "minere:is_sinking";
const SINK_DESPAWN_DELAY = 120;
const NECROMANCER_CHANCE = 0.05;

export class Skelephant extends BaseCustomEntity {
  constructor() {
    super(TYPE_ID);
  }

  onEntitySpawn(data: EntitySpawnAfterEvent): void {
    const skelephant = data.entity;
    system.run(() => {
      if (!isAlive(skelephant)) return;
      this.addSkeletonJockeys(skelephant);
    });
  }

  onEntityHurt(data: { hurtEntity: Entity; damageSource: { damagingEntity?: Entity } }): void {
    const skelephant = data.hurtEntity;
    if (this.isSinking(skelephant)) return;

    if (this.shouldSinkFromDaylight(skelephant)) {
      this.dismountRiders(skelephant);
      skelephant.triggerEvent("minere:start_sinking");
      system.runTimeout(() => {
        if (isAlive(skelephant)) skelephant.remove();
      }, SINK_DESPAWN_DELAY);
      return;
    }

    this.tryStomp(skelephant, data.damageSource.damagingEntity);
  }

  onEntityHurtEntity(data: EntityHurtAfterEvent): void {
    throwEntity(
      data.damageSource.damagingEntity.location,
      data.hurtEntity,
      3.0,
      1.0,
    );
  }

  private addSkeletonJockeys(skelephant: Entity): void {
    // Every Skelephant carries a rider pack of one to five skeletons.
    const riderCount = 1 + Math.floor(Math.random() * 5);
    for (let index = 0; index < riderCount; index++) {
      const riderType =
        index === 0 && Math.random() < NECROMANCER_CHANCE
          ? "minere:necromancer"
          : this.getJockeyType(skelephant);
      const skeleton = skelephant.dimension.spawnEntity(
        riderType as never,
        skelephant.location,
      );
      if (riderType === "minecraft:skeleton") {
        // Override the custom skeleton spawn roll so jockeys always use bows.
        skeleton.triggerEvent("minecraft:ranged_mode");
      }
      const rideable = skelephant.getComponent(EntityComponentTypes.Rideable) as EntityRideableComponent;
      rideable?.addRider(skeleton);
      if (riderType === "minere:necromancer") {
        skeleton.triggerEvent("minere:mounted");
      }
    }
    skelephant.triggerEvent("minere:saddled");
  }

  private getJockeyType(
    skelephant: Entity,
  ): "minecraft:parched" | "minecraft:stray" | "minecraft:skeleton" {
    const biomeTags = skelephant.dimension.getBiome(skelephant.location).getTags();
    return biomeTags.includes("desert") || biomeTags.includes("mesa")
      ? "minecraft:parched"
      : biomeTags.includes("cold") || biomeTags.includes("frozen") ? "minecraft:stray" : "minecraft:skeleton";
  }

  private tryStomp(skelephant: Entity, attacker?: Entity): void {
    if (!isAlive(attacker) || !isAlive(skelephant)) return;
    if (!isOffCooldown(skelephant, STOMP_COOLDOWN_PROPERTY_ID, STOMP_COOLDOWN)) return;
    if (Math.random() >= STOMP_CHANCE || distVector3(skelephant.location, attacker.location) >= STOMP_ACTIVATION_RANGE) return;

    skelephant.setDynamicProperty(STOMP_COOLDOWN_PROPERTY_ID, system.currentTick);
    skelephant.triggerEvent("minere:start_stomp");
    system.runTimeout(() => {
      if (!isAlive(skelephant)) return;
      const damageSource: EntityDamageSource = { damagingEntity: skelephant, cause: EntityDamageCause.entityAttack };
      for (const entity of skelephant.dimension.getEntities({ location: skelephant.location, maxDistance: STOMP_DAMAGE_RANGE })) {
        if (entity.id === skelephant.id || entity.typeId === "minecraft:item" || entity.typeId === "minecraft:xp_orb") continue;
        const family = entity.getComponent(EntityComponentTypes.TypeFamily) as EntityTypeFamilyComponent;
        if (
          family?.hasTypeFamily("skeleton") ||
          family?.hasTypeFamily("necromancer")
        ) continue;
        if (entity.location.y > skelephant.location.y + 2.5) continue;
        applyBombDamageBonus(entity, getScaledDamage(distVector3(skelephant.location, entity.location), STOMP_DAMAGE_RANGE, STOMP_DAMAGE_MIN, STOMP_DAMAGE_MAX, 0.5), damageSource);
      }
    }, 18);
  }

  private isSinking(skelephant: Entity): boolean {
    return skelephant.getProperty(SINKING_PROPERTY_ID) === true;
  }

  private shouldSinkFromDaylight(skelephant: Entity): boolean {
    const isDaytime =
      world.getTimeOfDay() > 200 && world.getTimeOfDay() < 11000;
    const isOnSurface =
      (skelephant.getBlockStandingOn()?.getSkyLightLevel() ?? 0) > 5;

    return (
      skelephant.dimension.id === "minecraft:overworld" &&
      isDaytime &&
      isOnSurface &&
      !isUnderground(skelephant)
    );
  }

  private dismountRiders(skelephant: Entity): void {
    const rideable = skelephant.getComponent(
      EntityComponentTypes.Rideable,
    ) as EntityRideableComponent;
    rideable?.ejectRiders();
  }
}
