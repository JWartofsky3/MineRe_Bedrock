import { Entity, GameMode, world } from "@minecraft/server";
import { distVector3 } from "util/vector3Functions";
import { isAlive } from "mob/mob_utils";

const TARGET_PROPERTY = "minere:entity_target";

export function setTarget(source: Entity, target: Entity | null): void {
  if (!isAlive(source)) {
    return;
  }
  if (!target || !isAlive(target)) {
    source.setDynamicProperty(TARGET_PROPERTY, undefined);
    return;
  }
  source.setDynamicProperty(TARGET_PROPERTY, target.id);
}

export function getTarget(
  source: Entity,
  entityType?: string,
  families?: string | string[],
  maxRange?: number,
): Entity {
  if (!isAlive(source)) {
    return null;
  }

  const dimension = source.dimension;
  const targetId = source.getDynamicProperty(TARGET_PROPERTY) as string;
  if (targetId) {
    const existing = world.getEntity(targetId);
    if (
      isAlive(existing) &&
      existing.dimension === dimension &&
      distVector3(existing.location, source.location) <= maxRange
    ) {
      return existing;
    }
  }

  const familyList = Array.isArray(families) ? families : [families];

  const entities = dimension.getEntities({
    location: source.location,
    maxDistance: maxRange || 32,
    type: entityType,
    families: familyList.length > 0 ? familyList : undefined,
    excludeGameModes: [GameMode.Creative, GameMode.Spectator],
  });

  let target: Entity = null;
  let bestDist = Number.POSITIVE_INFINITY;

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    if (!isAlive(entity)) {
      continue;
    }
    const dist = distVector3(entity.location, source.location);
    if (dist < bestDist) {
      bestDist = dist;
      target = entity;
    }
  }

  if (target) {
    source.setDynamicProperty(TARGET_PROPERTY, target.id);
  }

  return target;
}
