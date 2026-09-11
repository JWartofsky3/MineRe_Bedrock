import {
  system,
  world,
  EntitySpawnAfterEvent,
  Dimension,
  Player,
  Vector3,
} from "@minecraft/server";
import { hasBlockInRadius } from "blocks/functions/getBlocksInRadius";
import { RegisterableEvent } from "events/CustomEvent";

const SPAWN_CHANCE_MIN = 0.05;
const SPAWN_CHANCE_MAX = 0.15;
const LEVEL_MIN = 15;
const LEVEL_CAP = 50;
const MIN_WORLD_DAYS = 10;
const SPAWN_CHANCE_COOLDOWN_TICKS = 90 * 60 * 20;
const GLACIER_SPAWN_PROP = "minere:glacier_spawn";
const SPAWNER_BLOCK_RADIUS = 12;
const SURFACE_CHANCE_ROLL = 0.5;

type Challenger = {
  player: Player;
  effectiveLevel: number;
};

export class GlacierSpawnEvent implements RegisterableEvent {
  register(): void {
    world.afterEvents.entitySpawn.subscribe((data) => handleGlacierSpawn(data));
  }
}

function handleGlacierSpawn(data: EntitySpawnAfterEvent): void {
  const entity = data.entity;
  if (entity.typeId !== "minere:freeze") {
    return;
  }

  if (entity.getBlockStandingOn()?.getSkyLightLevel() > 5) {
    if (Math.random() < SURFACE_CHANCE_ROLL) {
      return;
    }
  }

  const dimension = entity.dimension;
  const location = entity.location;
  const otherGlaciers = dimension.getEntities({
    type: "minere:glacier",
    location: location,
    maxDistance: 64,
  });
  if (otherGlaciers.length > 0) {
    return;
  }

  const players = dimension.getPlayers({
    location: location,
    maxDistance: 64,
  });

  let challenger: Challenger | undefined = undefined;
  for (const player of players) {
    const effectiveLevel = player.level;
    const miniBossProp = player.getDynamicProperty(GLACIER_SPAWN_PROP);
    if (!!miniBossProp && typeof miniBossProp === "number") {
      if (system.currentTick - miniBossProp < SPAWN_CHANCE_COOLDOWN_TICKS) {
        continue;
      }
    }

    if (
      !challenger ||
      effectiveLevel > challenger.effectiveLevel ||
      effectiveLevel === challenger.effectiveLevel
    ) {
      challenger = {
        player: player,
        effectiveLevel: effectiveLevel,
      };
    }
  }
  if (!challenger) {
    return;
  }
  if (world.getDay() < MIN_WORLD_DAYS) {
    return;
  }

  const spawnChance =
    SPAWN_CHANCE_MIN +
    ((SPAWN_CHANCE_MAX - SPAWN_CHANCE_MIN) *
      (Math.min(challenger.effectiveLevel, LEVEL_CAP) - LEVEL_MIN)) /
      (LEVEL_CAP - LEVEL_MIN);
  if (Math.random() > spawnChance) {
    return;
  }
  if (hasNearbyMobSpawner(dimension, location)) {
    return;
  }

  challenger.player.setDynamicProperty(GLACIER_SPAWN_PROP, system.currentTick);
  entity.remove();
  dimension.spawnEntity<string>("minere:glacier", location);
}

function hasNearbyMobSpawner(dimension: Dimension, location: Vector3): boolean {
  return hasBlockInRadius(
    dimension,
    location,
    SPAWNER_BLOCK_RADIUS,
    (block) => {
      return block.typeId === "minecraft:mob_spawner";
    },
  );
}
