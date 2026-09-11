import { system, Entity, Vector3 } from "@minecraft/server";
import { isSolid } from "block/blockUtils";
import { findValidLocation } from "functions/area/findValidLocation";
import { particleWave } from "particles/particleWave";
import { distVector3 } from "util/vector3Functions";

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
  LINE_OF_SIGHT_STEP: 0.75,
};

export const TELEPORT_COOLDOWN = TELEPORT_PROPERTIES.COOLDOWN;

type InfernoTeleportDynamicProperties = {
  CYCLE_COUNTER: string;
  LAST_TELEPORT_CYCLE: string;
  ORIGIN_POS: string;
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
  const destination = findValidLocation({
    dimension: entity.dimension,
    origin,
    attempts: 36,
    maxHorizontalDistance: maxTeleportDistance,
    minVerticalOffset: -TELEPORT_PROPERTIES.VERTICAL_RANGE,
    maxVerticalOffset: TELEPORT_PROPERTIES.VERTICAL_RANGE,
    centerOnBlock: true,
    clearance: {
      width: 1,
      height: TELEPORT_PROPERTIES.REQUIRED_CLEARANCE_HEIGHT,
      requireGround: false,
    },
    target: {
      location: origin,
      minDistance: minTeleportDistance,
      maxDistance: maxTeleportDistance,
      maxVerticalDistance: TELEPORT_PROPERTIES.VERTICAL_RANGE,
    },
    isValidCandidate: (location) =>
      isWithinTeleportRange(entity, location, options.dynamicProperties) &&
      hasTeleportLineOfSight(location, target),
  });
  if (destination) {
    teleportWithEffects(entity, destination, origin);
    markTeleported(entity, options.dynamicProperties);
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

  if (entity.isInWater) {
    return true;
  }

  const currentCycle = entity.getDynamicProperty(
    dynamicProperties.CYCLE_COUNTER,
  );
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
  const currentCycle = entity.getDynamicProperty(
    dynamicProperties.CYCLE_COUNTER,
  );
  const currentValue = typeof currentCycle === "number" ? currentCycle : 0;
  entity.setDynamicProperty(
    dynamicProperties.LAST_TELEPORT_CYCLE,
    currentValue,
  );
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
  if (
    distVector3(entity.location, destination) > TELEPORT_PROPERTIES.MAX_DISTANCE
  ) {
    return false;
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

function hasTeleportLineOfSight(destination: Vector3, target: Entity): boolean {
  const start = getUpperBodyLocationAtLocation(target, destination);
  const end = getUpperBodyLocation(target);
  const distance = distVector3(start, end);
  const steps = Math.max(
    1,
    Math.floor(distance / TELEPORT_PROPERTIES.LINE_OF_SIGHT_STEP),
  );

  for (let i = 1; i < steps; i++) {
    const progress = i / steps;
    const sample = interpolateVector3(start, end, progress);
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

function getUpperBodyLocation(entity: Entity): Vector3 {
  const headLocation = entity.getHeadLocation();
  return {
    x: entity.location.x,
    y: entity.location.y + (headLocation.y - entity.location.y) * 0.75,
    z: entity.location.z,
  };
}

function getUpperBodyLocationAtLocation(
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

function interpolateVector3(
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
