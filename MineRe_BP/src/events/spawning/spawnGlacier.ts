import {
  system,
  world,
  EntitySpawnAfterEvent,
  Dimension,
  EntityComponentTypes,
  EntityEquippableComponent,
  EquipmentSlot,
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
const GLACIER_TOTEM_ID = "minere:glacier_totem";
const GLACIER_WARD_ID = "minere:glacier_ward";
const SURFACE_CHANCE_ROLL = 0.5;

type Challenger = {
  player: Player;
  effectiveLevel: number;
  hasTotem: boolean;
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
    const glacierHeldItemState = getGlacierHeldItemState(player);
    if (glacierHeldItemState.hasWard) {
      return;
    }

    const effectiveLevel = glacierHeldItemState.hasTotem
      ? LEVEL_CAP
      : player.level;
    const miniBossProp = player.getDynamicProperty(GLACIER_SPAWN_PROP);
    if (
      !glacierHeldItemState.hasTotem &&
      !!miniBossProp &&
      typeof miniBossProp === "number"
    ) {
      if (system.currentTick - miniBossProp < SPAWN_CHANCE_COOLDOWN_TICKS) {
        continue;
      }
    }

    if (
      !challenger ||
      effectiveLevel > challenger.effectiveLevel ||
      (effectiveLevel === challenger.effectiveLevel &&
        glacierHeldItemState.hasTotem &&
        !challenger.hasTotem)
    ) {
      challenger = {
        player: player,
        effectiveLevel: effectiveLevel,
        hasTotem: glacierHeldItemState.hasTotem,
      };
    }
  }
  if (!challenger) {
    return;
  }
  if (!challenger.hasTotem && world.getDay() < MIN_WORLD_DAYS) {
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

function getGlacierHeldItemState(player: Player): {
  hasTotem: boolean;
  hasWard: boolean;
} {
  const equippable = player.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;
  if (!equippable) {
    return {
      hasTotem: false,
      hasWard: false,
    };
  }

  const mainhand = equippable.getEquipment(EquipmentSlot.Mainhand);
  const offhand = equippable.getEquipment(EquipmentSlot.Offhand);
  const hasWard =
    mainhand?.typeId === GLACIER_WARD_ID || offhand?.typeId === GLACIER_WARD_ID;
  const hasTotem =
    mainhand?.typeId === GLACIER_TOTEM_ID ||
    offhand?.typeId === GLACIER_TOTEM_ID;

  return {
    hasTotem: hasTotem,
    hasWard: hasWard,
  };
}
