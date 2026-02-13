import {
  system,
  Dimension,
  Vector3,
  Block,
  Entity,
  EntityQueryOptions,
  BlockFilter,
  WorldSoundOptions,
} from "@minecraft/server";
import {
  addVector3,
  directionVector3,
  distVector3,
  multiplyVector3Number,
  randomVector3,
} from "util/vector3Functions";

export type ParticleWave = {
  index: number;
  location: Vector3;
  direction: Vector3;
  distance: number;
  progress: number;
  isStart: boolean;
  isEnd: boolean;
};

export type ParticleWaveOptions = {
  particle: string | string[];
  dimension: Dimension;
  startLocation: Vector3;
  endLocation: Vector3;
  ticksPerStep?: number;
  stepDistance?: number;
  soundEffect?: string;
  soundOptions?: WorldSoundOptions;
  onStart?: (wave: ParticleWave) => void;
  onStep?: (wave: ParticleWave) => void;
  onComplete?: (wave: ParticleWave) => void;
  particleCloudOptions?: {
    distance: number;
    count: number;
    // particle to use for cloud. Falls back to main particle if not specified
    particle?: string | string[];
  };
  entityOptions?: {
    effect?: (entity: Entity, wave: ParticleWave) => void;
    filter?: EntityQueryOptions;
    excludeIds?: string[];
    oncePerWave?: boolean;
  };
  blockOptions?: {
    effect?: (block: Block, wave: ParticleWave) => void;
    filter?: BlockFilter;
    oncePerWave?: boolean;
  };
  effect?: (wave: ParticleWave) => void;
};

export function particleWave(options: ParticleWaveOptions) {
  const stepDistance = Math.max(options.stepDistance ?? 1, 0.001);
  const ticksPerStep = Math.max(options.ticksPerStep ?? 1, 0);
  const totalDistance = distVector3(options.startLocation, options.endLocation);
  const direction =
    totalDistance > 0
      ? directionVector3(options.endLocation, options.startLocation)
      : { x: 0, y: 0, z: 0 };
  const stepCount = Math.max(Math.ceil(totalDistance / stepDistance), 1);

  const particles = normalizeParticles(options.particle);
  const cloudParticles = normalizeParticles(
    options.particleCloudOptions?.particle ?? options.particle,
  );

  const excludedEntities = new Set(options.entityOptions?.excludeIds ?? []);
  const touchedEntities = new Set<string>();

  let finalStep = createStep({
    index: 0,
    stepCount,
    start: options.startLocation,
    direction,
    totalDistance,
    stepDistance,
  });

  const runStep = (index: number) => {
    const step = createStep({
      index,
      stepCount,
      start: options.startLocation,
      direction,
      totalDistance,
      stepDistance,
    });
    finalStep = step;

    emitParticles(options.dimension, particles, step.location);

    if (options.soundEffect) {
      options.dimension.playSound(
        options.soundEffect,
        step.location,
        options.soundOptions,
      );
    }

    // Spawn additional cloud particles around this step location.
    if (options.particleCloudOptions) {
      emitParticleCloud(
        options.dimension,
        cloudParticles,
        step.location,
        options.particleCloudOptions.distance,
        options.particleCloudOptions.count,
      );
    }

    if (step.isStart && options.onStart) {
      options.onStart(step);
    }

    if (options.effect) {
      options.effect(step);
    }

    if (options.onStep) {
      options.onStep(step);
    }

    if (options.entityOptions?.effect) {
      const foundEntities = getStepEntities(options.dimension, step, options);
      for (let i = 0; i < foundEntities.length; i++) {
        const entity = foundEntities[i];
        if (excludedEntities.has(entity.id)) {
          continue;
        }
        if (
          options.entityOptions.oncePerWave &&
          touchedEntities.has(entity.id)
        ) {
          continue;
        }
        touchedEntities.add(entity.id);
        options.entityOptions.effect(entity, step);
      }
    }

    if (options.blockOptions?.effect) {
      const block = options.dimension.getBlock(step.location);
      if (block && block.isValid) {
        options.blockOptions.effect(block, step);
      }
    }
  };

  // Schedule each step so callers can choose instant waves (0) or animated waves (>0).
  for (let i = 0; i <= stepCount; i++) {
    const delay = i * ticksPerStep;
    system.runTimeout(() => {
      runStep(i);
      if (i === stepCount && options.onComplete) {
        options.onComplete(finalStep);
      }
    }, delay);
  }

  return finalStep;
}

function normalizeParticles(particle: string | string[]): string[] {
  if (Array.isArray(particle)) {
    return particle;
  }
  return [particle];
}

function emitParticles(
  dimension: Dimension,
  particles: string[],
  location: Vector3,
) {
  for (let i = 0; i < particles.length; i++) {
    try {
      dimension.spawnParticle(particles[i], location);
    } catch (ignored) {
      // Skip invalid particle ids to keep the wave running.
    }
  }
}

function emitParticleCloud(
  dimension: Dimension,
  particles: string[],
  location: Vector3,
  distance: number,
  count: number,
) {
  if (particles.length === 0) {
    return;
  }
  const cloudDistance = Math.max(distance, 0);
  const cloudCount = Math.max(Math.floor(count), 0);
  for (let i = 0; i < cloudCount; i++) {
    const cloudLocation = addVector3(location, randomVector3(cloudDistance));
    // Each cloud spawn gets one random particle choice and its own random position.
    const particle = particles[Math.floor(Math.random() * particles.length)];
    try {
      dimension.spawnParticle(particle, cloudLocation);
    } catch (ignored) {
      // Skip invalid particle ids to keep the wave running.
    }
  }
}

function getStepEntities(
  dimension: Dimension,
  step: ParticleWave,
  options: ParticleWaveOptions,
): Entity[] {
  const entityOptions = options.entityOptions;
  if (!entityOptions) {
    return [];
  }

  const dedupe = new Map<string, Entity>();
  const rangeQuery: EntityQueryOptions = {
    ...(entityOptions.filter ?? {}),
    location: step.location,
    maxDistance: entityOptions.filter?.maxDistance ?? 1,
  };

  const entitiesByRange = dimension.getEntities(rangeQuery);
  for (let i = 0; i < entitiesByRange.length; i++) {
    dedupe.set(entitiesByRange[i].id, entitiesByRange[i]);
  }

  const entitiesAtLocation = dimension.getEntitiesAtBlockLocation(
    step.location,
  );
  for (let i = 0; i < entitiesAtLocation.length; i++) {
    dedupe.set(entitiesAtLocation[i].id, entitiesAtLocation[i]);
  }

  return [...dedupe.values()];
}

function createStep(args: {
  index: number;
  stepCount: number;
  start: Vector3;
  direction: Vector3;
  totalDistance: number;
  stepDistance: number;
}): ParticleWave {
  const normalizedProgress = args.index / args.stepCount;
  const traveled = Math.min(args.totalDistance, args.index * args.stepDistance);

  return {
    index: args.index,
    location: addVector3(
      args.start,
      multiplyVector3Number(args.direction, traveled),
    ),
    direction: args.direction,
    distance: traveled,
    progress: normalizedProgress,
    isStart: args.index === 0,
    isEnd: args.index === args.stepCount,
  };
}
