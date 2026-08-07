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
const LEVEL_MIN = 10;
const LEVEL_CAP = 50;
const SPAWN_CHANCE_COOLDOWN_TICKS = 30 * 60 * 20; // 30 minutes
const INFERNO_SPAWN_PROP = "minere:inferno_spawn";
const SPAWNER_BLOCK_RADIUS = 12;
const INFERNO_TOTEM_ID = "minere:inferno_totem";
const INFERNO_WARD_ID = "minere:inferno_ward";

type Challenger = {
  player: Player;
  effectiveLevel: number;
  hasTotem: boolean;
};

export class InfernoSpawnEvent implements RegisterableEvent {
  register(): void {
    world.afterEvents.entitySpawn.subscribe((data) => handleInfernoSpawn(data));
  }
}

function handleInfernoSpawn(data: EntitySpawnAfterEvent) {
  const entity = data.entity;
  if (entity.typeId !== "minecraft:blaze") {
    return;
  }
  const dimension = entity.dimension;
  const location = entity.location;

  // check for other infernoes
  const otherInfernoes = dimension.getEntities({
    type: "minere:inferno",
    location: location,
    maxDistance: 64,
  });
  if (otherInfernoes.length > 0) {
    return;
  }

  // check player XP level
  const players = dimension.getPlayers({
    location: location,
    maxDistance: 64,
  });

  let challenger: Challenger | undefined = undefined;
  for (const player of players) {
    const infernoHeldItemState = getInfernoHeldItemState(player);
    if (infernoHeldItemState.hasWard) {
      return;
    }

    const effectiveLevel = infernoHeldItemState.hasTotem
      ? LEVEL_CAP
      : player.level;
    const miniBossProp = player.getDynamicProperty(INFERNO_SPAWN_PROP);
    if (
      !infernoHeldItemState.hasTotem &&
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
        infernoHeldItemState.hasTotem &&
        !challenger.hasTotem)
    ) {
      challenger = {
        player: player,
        effectiveLevel: effectiveLevel,
        hasTotem: infernoHeldItemState.hasTotem,
      };
    }
  }
  if (!challenger) {
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

  challenger.player.setDynamicProperty(INFERNO_SPAWN_PROP, system.currentTick);
  entity.remove();
  dimension.spawnEntity<string>("minere:inferno", location);
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

function getInfernoHeldItemState(player: Player): {
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
    mainhand?.typeId === INFERNO_WARD_ID || offhand?.typeId === INFERNO_WARD_ID;
  const hasTotem =
    mainhand?.typeId === INFERNO_TOTEM_ID ||
    offhand?.typeId === INFERNO_TOTEM_ID;

  return {
    hasTotem: hasTotem,
    hasWard: hasWard,
  };
}
