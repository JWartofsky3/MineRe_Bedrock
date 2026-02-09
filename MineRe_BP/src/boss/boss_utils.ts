import { world, Entity, GameMode } from "@minecraft/server";
import { isAlive } from "mob/mob_utils";
import { distVector3 } from "util/vector3Functions";

export const BOSS_TARGET_ID = "minere:boss_target";
const MAX_TARGET_DISTANCE = 64;

export function SetBossTarget(boss: Entity, target: Entity) {
  if (!isAlive(boss) || !isAlive(target)) {
    return;
  }
  boss.setDynamicProperty(BOSS_TARGET_ID, target.id);
}

export function GetBossTarget(boss: Entity): Entity {
  if (!isAlive(boss)) {
    return null;
  }

  const dimension = boss.dimension;

  let target: Entity = null;
  const targetId = boss.getDynamicProperty(BOSS_TARGET_ID) as string;
  if (targetId) {
    target = world.getEntity(targetId);
    if (
      isAlive(target) &&
      target.dimension == dimension &&
      distVector3(target.location, boss.location) < MAX_TARGET_DISTANCE
    ) {
      return target;
    }
  }

  const entities = dimension.getEntities({
    location: boss.location,
    maxDistance: MAX_TARGET_DISTANCE,
    families: ["player"],
    excludeGameModes: [GameMode.Creative, GameMode.Spectator],
  });

  let TargetDistance = 0;

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    if (isAlive(entity)) {
      if (
        target == null ||
        distVector3(target.location, boss.location) >
          distVector3(entity.location, boss.location)
      ) {
        target = entity;
      }
    }
  }
  boss.setDynamicProperty(BOSS_TARGET_ID, target?.id);

  return target;
}
