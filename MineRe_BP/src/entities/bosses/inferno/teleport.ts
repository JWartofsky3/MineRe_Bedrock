import { Entity } from "@minecraft/server";
import { particleWave } from "particles/particleWave";
import { distVector3, getRandomAir } from "util/vector3Functions";

const TELEPORT_PROPERTIES = {
  MAX_DISTANCE: 32,
  MAX_DISTANCE_TO_TARGET: 25,
  MIN_DISTANCE_TO_TARGET: 8,
  VERTICAL_RANGE: 6,
  COOLDOWN: 7,
  MAX_ORIGIN_DISTANCE: 64,
  TELEPORT_CHANCE_MIN: 0.2,
  TELEPORT_CHANCE_MAX: 0.45,
  LOW_HEALTH_DISTANCE_BONUS: 8,
  PARTICLE_ID: "minecraft:basic_flame_particle",
  SOUND_ID: "mob.ghast.fireball",
  SOUND_VOLUME: 0.5,
  REQUIRED_CLEARANCE_HEIGHT: 4,
};

export const TELEPORT_COOLDOWN = TELEPORT_PROPERTIES.COOLDOWN;

type InfernoTeleportDynamicProperties = {
  CYCLE_COUNTER: string;
  LAST_TELEPORT_CYCLE: string;
  ORIGIN_POS: string;
  RETREAT_RUNNER: string;
};

type InfernoTeleportOptions = {
  entity: Entity;
  target: Entity;
  getMode: (entity: Entity) => number;
  getLowHealthFactor: (entity: Entity) => number;
  dynamicProperties: InfernoTeleportDynamicProperties;
  allowedModes: number[];
};

export function getInfernoTeleportChance(
  entity: Entity,
  getLowHealthFactor: (entity: Entity) => number,
): number {
  const lowHealthFactor = getLowHealthFactor(entity);
  return (
    TELEPORT_PROPERTIES.TELEPORT_CHANCE_MIN +
    (TELEPORT_PROPERTIES.TELEPORT_CHANCE_MAX -
      TELEPORT_PROPERTIES.TELEPORT_CHANCE_MIN) *
      lowHealthFactor
  );
}

export function tryInfernoTeleport(options: InfernoTeleportOptions): void {
  const { entity, target } = options;
  if (!target?.isValid) {
    return;
  }
  if (!canTeleport(options)) {
    return;
  }

  const origin = target.location;
  const distanceBonus = getTeleportDistanceBonus(
    entity,
    options.getLowHealthFactor,
  );
  const minTeleportDistance =
    TELEPORT_PROPERTIES.MIN_DISTANCE_TO_TARGET + distanceBonus;
  const maxTeleportDistance =
    TELEPORT_PROPERTIES.MAX_DISTANCE_TO_TARGET + distanceBonus;
  const randomOffset = Math.ceil(maxTeleportDistance);

  for (let i = 0; i < 6; i++) {
    const candidate = getRandomAir(origin, entity.dimension, randomOffset, 6);
    if (!candidate) {
      continue;
    }
    const destination = snapToBlockCenter(candidate);
    const distance = distVector3(destination, origin);
    const vertical = Math.abs(destination.y - origin.y);
    if (distance < minTeleportDistance || distance > maxTeleportDistance) {
      continue;
    }
    if (vertical > TELEPORT_PROPERTIES.VERTICAL_RANGE) {
      continue;
    }
    if (!isWithinTeleportRange(entity, destination, options.dynamicProperties)) {
      continue;
    }
    if (!isSafeTeleportDestination(entity, destination)) {
      continue;
    }
    teleportWithEffects(entity, destination, origin);
    markTeleported(entity, options.dynamicProperties);
    return;
  }
}

function getTeleportDistanceBonus(
  entity: Entity,
  getLowHealthFactor: (entity: Entity) => number,
): number {
  return (
    getLowHealthFactor(entity) * TELEPORT_PROPERTIES.LOW_HEALTH_DISTANCE_BONUS
  );
}

function canTeleport(options: InfernoTeleportOptions): boolean {
  const { entity, getMode, allowedModes, dynamicProperties } = options;
  const mode = getMode(entity);
  if (!allowedModes.includes(mode)) {
    return false;
  }
  const retreatRunner = entity.getDynamicProperty(dynamicProperties.RETREAT_RUNNER);
  if (typeof retreatRunner === "number") {
    return false;
  }

  if (entity.isInWater) {
    return true;
  }

  const currentCycle = entity.getDynamicProperty(dynamicProperties.CYCLE_COUNTER);
  const lastCycle = entity.getDynamicProperty(
    dynamicProperties.LAST_TELEPORT_CYCLE,
  );
  const currentValue = typeof currentCycle === "number" ? currentCycle : 0;
  const lastValue = typeof lastCycle === "number" ? lastCycle : 0;
  return currentValue - lastValue >= TELEPORT_PROPERTIES.COOLDOWN;
}

function markTeleported(
  entity: Entity,
  dynamicProperties: InfernoTeleportDynamicProperties,
): void {
  const currentCycle = entity.getDynamicProperty(dynamicProperties.CYCLE_COUNTER);
  const currentValue = typeof currentCycle === "number" ? currentCycle : 0;
  entity.setDynamicProperty(dynamicProperties.LAST_TELEPORT_CYCLE, currentValue);
}

function isWithinTeleportRange(
  entity: Entity,
  destination: { x: number; y: number; z: number },
  dynamicProperties: InfernoTeleportDynamicProperties,
): boolean {
  const origin = entity.getDynamicProperty(dynamicProperties.ORIGIN_POS) as {
    x: number;
    y: number;
    z: number;
  };
  if (
    origin &&
    distVector3(origin, destination) > TELEPORT_PROPERTIES.MAX_ORIGIN_DISTANCE
  ) {
    return false;
  }
  if (distVector3(entity.location, destination) > TELEPORT_PROPERTIES.MAX_DISTANCE) {
    return false;
  }
  return true;
}

function snapToBlockCenter(location: { x: number; y: number; z: number }): {
  x: number;
  y: number;
  z: number;
} {
  return {
    x: Math.floor(location.x) + 0.5,
    y: Math.floor(location.y),
    z: Math.floor(location.z) + 0.5,
  };
}

function isSafeTeleportDestination(
  entity: Entity,
  destination: { x: number; y: number; z: number },
): boolean {
  const base = {
    x: Math.floor(destination.x),
    y: Math.floor(destination.y),
    z: Math.floor(destination.z),
  };
  const floorBlock = entity.dimension.getBlock({
    x: base.x,
    y: base.y - 1,
    z: base.z,
  });
  if (!floorBlock?.isValid) {
    return false;
  }
  if (floorBlock.isAir) {
    return false;
  }

  for (let y = 0; y < TELEPORT_PROPERTIES.REQUIRED_CLEARANCE_HEIGHT; y++) {
    const checkBlock = entity.dimension.getBlock({
      x: base.x,
      y: base.y + y,
      z: base.z,
    });
    if (!checkBlock?.isValid) {
      return false;
    }
    if (!checkBlock.isAir) {
      return false;
    }
  }
  return true;
}

function teleportWithEffects(
  entity: Entity,
  destination: { x: number; y: number; z: number },
  faceLocation: { x: number; y: number; z: number },
): void {
  particleWave({
    startLocation: entity.location,
    endLocation: destination,
    dimension: entity.dimension,
    particle: TELEPORT_PROPERTIES.PARTICLE_ID,
    soundEffect: TELEPORT_PROPERTIES.SOUND_ID,
    soundOptions: { volume: TELEPORT_PROPERTIES.SOUND_VOLUME },
    ticksPerStep: 0,
    particleCloudOptions: {
      distance: 2,
      count: 10,
    },
  });

  entity.teleport(destination, {
    facingLocation: faceLocation,
    keepVelocity: false,
  });
  entity.clearVelocity();
}
