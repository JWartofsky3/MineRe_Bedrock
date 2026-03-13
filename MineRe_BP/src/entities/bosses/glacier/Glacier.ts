import {
  Block,
  Entity,
  EntityComponentTypes,
  EntityDamageCause,
  EntityHurtAfterEvent,
  EntityQueryOptions,
  Vector3,
  system,
  world,
} from "@minecraft/server";
import { isSolid } from "block/blockUtils";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { isOffCooldown } from "entities/functions/checkCooldown";
import { throwEntity } from "entities/functions/throw";
import { freezeArea } from "functions/freezeArea";
import { isAlive } from "mob/mob_utils";
import { distVector3 } from "util/vector3Functions";

const GLACIER_TYPE_ID = "minere:glacier";
const TICK_INTERVAL: [number, number] = [16, 24];
const TARGET_FAMILIES = ["player", "villager", "irongolem"];
const EMERGING_PROPERTY = "minere:is_emerging";
const SUBMERGING_PROPERTY = "minere:is_submerging";

enum GlacierMode {
  Ranged = 0,
  Melee = 1,
}

const MODE_PROPERTIES = {
  MODE_PROPERTY: "minere:mode",
  COOLDOWN_PROPERTY: "minere:mode_change_cooldown",
  COOLDOWN: 20 * 5,
  CHANCE: 0.33,
  RANGE_BRACKETS: 8,
  MODE_WEIGHTS: [
    new Map<GlacierMode, number>([
      [GlacierMode.Ranged, 2],
      [GlacierMode.Melee, 8],
    ]),
    new Map<GlacierMode, number>([
      [GlacierMode.Ranged, 5],
      [GlacierMode.Melee, 5],
    ]),
    new Map<GlacierMode, number>([
      [GlacierMode.Ranged, 8],
      [GlacierMode.Melee, 2],
    ]),
  ] as Map<GlacierMode, number>[],
  EVENT_MAP: new Map<GlacierMode, string>([
    [GlacierMode.Ranged, "minere:switch_to_ranged"],
    [GlacierMode.Melee, "minere:switch_to_melee"],
  ]),
};

const ROAR_PROPERTIES = {
  PROP: "minere:glacier_roar_cooldown",
  COOLDOWN: 20 * 8,
  CHANCE: 0.125,
  ACTIVATION_RANGE: 8,
  ACTIVATION_DELAY: 1 * 20,
};

const TELEPORT_PROPERTIES = {
  PROP: "minere:glacier_teleport_cooldown",
  COOLDOWN: 20 * 20,
  CHANCE: 0.2,
  ATTEMPTS: 16,
  MIN_DISTANCE_TO_TARGET: 0,
  MAX_DISTANCE_TO_TARGET: 24,
  MIN_VERTICAL_OFFSET: -4,
  MAX_VERTICAL_OFFSET: 4,
  SUBMERGE_DURATION: 60,
  EMERGE_IMPACT_DELAY: 10,
  EMERGE_IMPACT_DAMAGE: 5,
  EMERGE_IMPACT_RADIUS: 2,
  EMERGE_IMPACT_KNOCKBACK: 1.5,
  EMERGE_IMPACT_VERTICAL: 1.0,
  CLEARANCE_RADIUS: 2,
  CLEARANCE_HEIGHT: 5,
  LINE_OF_SIGHT_STEP: 0.75,
  VALID_BLOCKS: new Set<string>([
    "minecraft:ice",
    "minecraft:packed_ice",
    "minecraft:blue_ice",
    "minecraft:snow",
  ]),
};

export class Glacier extends BaseCustomEntity {
  constructor() {
    super(GLACIER_TYPE_ID, {
      tick: TICK_INTERVAL,
      targetQuery: { families: TARGET_FAMILIES, maxDistance: 48 },
    });
  }

  onTick(entity: Entity): void {
    if (this.isTransitioning(entity)) {
      return;
    }

    const target = this.getTarget(entity);
    if (!isAlive(target)) {
      return;
    }

    if (this.tryTeleport(entity, target)) {
      return;
    }

    if (Math.random() > MODE_PROPERTIES.CHANCE) {
      return;
    }

    if (
      !isOffCooldown(
        entity,
        MODE_PROPERTIES.COOLDOWN_PROPERTY,
        MODE_PROPERTIES.COOLDOWN,
      )
    ) {
      return;
    }

    const distance = distVector3(entity.location, target.location);
    const currentMode = this.getMode(entity);
    const baseWeights = this.getWeightsForDistance(distance);
    const rolledWeights = this.applyCurrentModePenalty(
      baseWeights,
      currentMode,
    );
    const nextMode = this.pickWeightedMode(rolledWeights, GlacierMode.Ranged);

    if (nextMode === currentMode) {
      return;
    }

    const eventId = MODE_PROPERTIES.EVENT_MAP.get(nextMode);
    if (!eventId) {
      return;
    }

    entity.setProperty(MODE_PROPERTIES.MODE_PROPERTY, nextMode);
    entity.triggerEvent(eventId);
    entity.setDynamicProperty(
      MODE_PROPERTIES.COOLDOWN_PROPERTY,
      system.currentTick,
    );
  }

  onEntityHurt(data: EntityHurtAfterEvent): void {
    if (!isAlive(data.hurtEntity)) {
      return;
    }
    const glacier = data.hurtEntity;
    const attacker = data.damageSource?.damagingEntity;

    const isDaytime =
      world.getTimeOfDay() > 200 && world.getTimeOfDay() < 11000;
    const isTransitioning = this.isTransitioning(glacier);
    const shouldSubmerge =
      (data.damageSource.cause === EntityDamageCause.temperature ||
        isDaytime) &&
      !isTransitioning;

    if (shouldSubmerge) {
      return this.submergeAndDespawn(glacier);
    }
    if (isTransitioning) {
      return;
    }

    if (!isAlive(attacker)) {
      return;
    }

    const distToAttacker = distVector3(glacier.location, attacker.location);
    if (
      distToAttacker < ROAR_PROPERTIES.ACTIVATION_RANGE &&
      Math.random() <= ROAR_PROPERTIES.CHANCE &&
      isOffCooldown(glacier, ROAR_PROPERTIES.PROP, ROAR_PROPERTIES.COOLDOWN)
    ) {
      glacier.triggerEvent("minere:glacier_start_roar");
      system.runTimeout(() => {
        freezeArea(glacier.dimension, glacier.location, {
          radius: 4,
          verticalRadius: 4,
          coverWithSnow: true,
        });
      }, ROAR_PROPERTIES.ACTIVATION_DELAY);
    }
  }

  private getWeightsForDistance(distance: number): Map<GlacierMode, number> {
    const bracketIndex = Math.min(
      Math.floor(distance / MODE_PROPERTIES.RANGE_BRACKETS),
      MODE_PROPERTIES.MODE_WEIGHTS.length - 1,
    );
    return new Map(MODE_PROPERTIES.MODE_WEIGHTS[bracketIndex]);
  }

  private applyCurrentModePenalty(
    weights: Map<GlacierMode, number>,
    currentMode: GlacierMode,
  ): Map<GlacierMode, number> {
    const currentWeight = weights.get(currentMode) ?? 0;
    weights.set(currentMode, currentWeight * 0.5);
    return weights;
  }

  private pickWeightedMode(
    weights: Map<GlacierMode, number>,
    fallback: GlacierMode,
  ): GlacierMode {
    let totalWeight = 0;
    for (const [, weight] of weights) {
      if (weight > 0) {
        totalWeight += weight;
      }
    }

    if (totalWeight <= 0) {
      return fallback;
    }

    let roll = Math.random() * totalWeight;
    for (const [mode, weight] of weights) {
      if (weight <= 0) {
        continue;
      }
      roll -= weight;
      if (roll <= 0) {
        return mode;
      }
    }

    return fallback;
  }

  private getMode(entity: Entity): GlacierMode {
    const value = entity.getProperty(MODE_PROPERTIES.MODE_PROPERTY);
    if (typeof value === "number") {
      return value as GlacierMode;
    }
    return GlacierMode.Ranged;
  }

  private isTransitioning(entity: Entity): boolean {
    return (
      entity.getProperty(EMERGING_PROPERTY) === true ||
      entity.getProperty(SUBMERGING_PROPERTY) === true
    );
  }

  private tryTeleport(entity: Entity, target: Entity): boolean {
    if (this.isTransitioning(entity)) {
      return false;
    }
    if (Math.random() > TELEPORT_PROPERTIES.CHANCE) {
      return false;
    }
    if (
      !isOffCooldown(
        entity,
        TELEPORT_PROPERTIES.PROP,
        TELEPORT_PROPERTIES.COOLDOWN,
      )
    ) {
      return false;
    }

    const destination = this.findTeleportDestination(entity, target);
    if (!destination) {
      return false;
    }
    const facingLocation = {
      x: target.location.x,
      y: target.location.y,
      z: target.location.z,
    };

    entity.triggerEvent("minere:start_submerging");
    entity.setDynamicProperty(TELEPORT_PROPERTIES.PROP, system.currentTick);

    system.runTimeout(() => {
      if (!isAlive(entity)) {
        return;
      }
      entity.teleport(destination, {
        facingLocation,
        keepVelocity: false,
      });
      entity.clearVelocity();
      entity.triggerEvent("minere:start_emerging");
      system.runTimeout(() => {
        if (!isAlive(entity)) {
          return;
        }
        this.applyEmergeImpact(entity);
      }, TELEPORT_PROPERTIES.EMERGE_IMPACT_DELAY);
    }, TELEPORT_PROPERTIES.SUBMERGE_DURATION);

    return true;
  }

  private findTeleportDestination(
    entity: Entity,
    target: Entity,
  ): Vector3 | null {
    const currentDistanceToTarget = distVector3(
      entity.location,
      target.location,
    );
    for (let i = 0; i < TELEPORT_PROPERTIES.ATTEMPTS; i++) {
      const destination = this.getTeleportCandidate(target.location);
      if (!destination) {
        continue;
      }
      if (
        distVector3(destination, target.location) >= currentDistanceToTarget
      ) {
        continue;
      }
      if (
        !this.isValidTeleportSurface(
          entity.dimension.getBlock({
            x: Math.floor(destination.x),
            y: Math.floor(destination.y) - 1,
            z: Math.floor(destination.z),
          }),
        )
      ) {
        continue;
      }
      if (!this.hasTeleportClearance(entity, destination)) {
        continue;
      }
      if (!this.hasTeleportLineOfSight(destination, target)) {
        continue;
      }
      return destination;
    }
    return null;
  }

  private getTeleportCandidate(targetLocation: Vector3): Vector3 | null {
    const angle = Math.random() * Math.PI * 2;
    const distance =
      TELEPORT_PROPERTIES.MIN_DISTANCE_TO_TARGET +
      Math.random() *
        (TELEPORT_PROPERTIES.MAX_DISTANCE_TO_TARGET -
          TELEPORT_PROPERTIES.MIN_DISTANCE_TO_TARGET);
    const yOffset =
      TELEPORT_PROPERTIES.MIN_VERTICAL_OFFSET +
      Math.floor(
        Math.random() *
          (TELEPORT_PROPERTIES.MAX_VERTICAL_OFFSET -
            TELEPORT_PROPERTIES.MIN_VERTICAL_OFFSET +
            1),
      );

    return {
      x: Math.floor(targetLocation.x + Math.cos(angle) * distance) + 0.5,
      y: Math.floor(targetLocation.y + yOffset),
      z: Math.floor(targetLocation.z + Math.sin(angle) * distance) + 0.5,
    };
  }

  private isValidTeleportSurface(block: Block | undefined): boolean {
    if (!block?.isValid) {
      return false;
    }
    return TELEPORT_PROPERTIES.VALID_BLOCKS.has(block.typeId);
  }

  private hasTeleportClearance(entity: Entity, destination: Vector3): boolean {
    const base = {
      x: Math.floor(destination.x),
      y: Math.floor(destination.y),
      z: Math.floor(destination.z),
    };

    for (
      let x = -TELEPORT_PROPERTIES.CLEARANCE_RADIUS;
      x <= TELEPORT_PROPERTIES.CLEARANCE_RADIUS;
      x++
    ) {
      for (
        let z = -TELEPORT_PROPERTIES.CLEARANCE_RADIUS;
        z <= TELEPORT_PROPERTIES.CLEARANCE_RADIUS;
        z++
      ) {
        const floorBlock = entity.dimension.getBlock({
          x: base.x + x,
          y: base.y - 1,
          z: base.z + z,
        });
        if (!this.isValidTeleportSurface(floorBlock)) {
          return false;
        }
        for (let y = 0; y < TELEPORT_PROPERTIES.CLEARANCE_HEIGHT; y++) {
          const block = entity.dimension.getBlock({
            x: base.x + x,
            y: base.y + y,
            z: base.z + z,
          });
          if (!block?.isValid || !block.isAir) {
            return false;
          }
        }
      }
    }

    return true;
  }

  private applyEmergeImpact(entity: Entity): void {
    const headLocation = {
      x: entity.location.x,
      y: entity.location.y + 2.5,
      z: entity.location.z,
    };
    const query: EntityQueryOptions = {
      location: headLocation,
      maxDistance: TELEPORT_PROPERTIES.EMERGE_IMPACT_RADIUS,
      excludeFamilies: ["monster", "freeze", "glacier", "ice_spike"],
    };
    const targets = entity.dimension.getEntities(query);

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (!isAlive(target) || target.id === entity.id) {
        continue;
      }
      target.applyDamage(TELEPORT_PROPERTIES.EMERGE_IMPACT_DAMAGE, {
        damagingEntity: entity,
        cause: EntityDamageCause.entityAttack,
      });
      throwEntity(
        headLocation,
        target,
        TELEPORT_PROPERTIES.EMERGE_IMPACT_KNOCKBACK,
        TELEPORT_PROPERTIES.EMERGE_IMPACT_VERTICAL,
      );
    }
  }

  private hasTeleportLineOfSight(
    destination: Vector3,
    target: Entity,
  ): boolean {
    const start = this.getUpperBodyLocationAtLocation(target, destination);
    const end = this.getUpperBodyLocation(target);
    const distance = distVector3(start, end);
    const steps = Math.max(
      1,
      Math.floor(distance / TELEPORT_PROPERTIES.LINE_OF_SIGHT_STEP),
    );

    for (let i = 1; i < steps; i++) {
      const progress = i / steps;
      const sample = this.interpolateVector3(start, end, progress);
      const block = target.dimension.getBlock({
        x: Math.floor(sample.x),
        y: Math.floor(sample.y),
        z: Math.floor(sample.z),
      });
      if (isSolid(block)) {
        return false;
      }
    }

    return true;
  }

  private getUpperBodyLocation(entity: Entity): Vector3 {
    const headLocation = entity.getHeadLocation();
    return {
      x: entity.location.x,
      y: entity.location.y + (headLocation.y - entity.location.y) * 0.75,
      z: entity.location.z,
    };
  }

  private getUpperBodyLocationAtLocation(
    entity: Entity,
    location: Vector3,
  ): Vector3 {
    const headLocation = entity.getHeadLocation();
    return {
      x: location.x,
      y: location.y + (headLocation.y - entity.location.y) * 0.75,
      z: location.z,
    };
  }

  private interpolateVector3(
    start: Vector3,
    end: Vector3,
    progress: number,
  ): Vector3 {
    return {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress,
      z: start.z + (end.z - start.z) * progress,
    };
  }

  private submergeAndDespawn(glacier: Entity) {
    glacier.triggerEvent("minere:start_submerging");
    system.runTimeout(() => {
      glacier.remove();
    }, 55);
  }
}
