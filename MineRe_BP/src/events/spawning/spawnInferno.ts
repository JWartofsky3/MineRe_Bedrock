import {
  system,
  world,
  EntitySpawnAfterEvent,
  Player,
} from "@minecraft/server";
import { RegisterableEvent } from "events/CustomEvent";

const SPAWN_CHANCE_MIN = 0.05;
const SPAWN_CHANCE_MAX = 0.15;
const LEVEL_MIN = 10;
const LEVEL_CAP = 50;
const SPAWN_CHANCE_COOLDOWN_TICKS = 30 * 60 * 20; // 30 minutes
const MINI_BOSS_SPAWN_TIME_PROP = "minere:mini_boss_spawn";

export class InfernoSpawnEvent implements RegisterableEvent {
  constructor() {
    world.afterEvents.entitySpawn.subscribe((data) => handleInfernoSpawn(data));
  }

  register(): void {
    // Registration is handled in the constructor.
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

  let challenger: Player | undefined = undefined;
  for (const player of players) {
    const miniBossProp = player.getDynamicProperty(MINI_BOSS_SPAWN_TIME_PROP);
    if (!!miniBossProp && typeof miniBossProp === "number") {
      if (system.currentTick - miniBossProp < SPAWN_CHANCE_COOLDOWN_TICKS) {
        continue;
      }
    }
    if (!challenger || player.level > challenger?.level) {
      challenger = player;
    }
  }
  if (!challenger) {
    return;
  }

  const spawnChance =
    SPAWN_CHANCE_MIN +
    ((SPAWN_CHANCE_MAX - SPAWN_CHANCE_MIN) *
      (Math.min(challenger.level, LEVEL_CAP) - LEVEL_MIN)) /
      (LEVEL_CAP - LEVEL_MIN);
  if (Math.random() > spawnChance) {
    return;
  }

  challenger.setDynamicProperty(MINI_BOSS_SPAWN_TIME_PROP, system.currentTick);
  entity.remove();
  dimension.spawnEntity("minere:inferno", location);
}
