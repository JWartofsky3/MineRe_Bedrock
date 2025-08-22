import {
  Dimension,
  Entity,
  EntityComponentTypes,
  EntityHealthComponent,
  EntityTypeFamilyComponent,
  world,
} from "@minecraft/server";
import { getBlock, isSolid, oceanBlocks } from "block/blockUtils";

export function isAlive(entity: Entity): boolean {
  if (!entity || !entity?.isValid) {
    return false;
  }
  const health = entity?.getComponent(
    EntityComponentTypes.Health,
  ) as EntityHealthComponent;
  if (!health) {
    return false;
  }
  return health.currentValue > 0;
}

export function isFamilySet(entity: Entity, families: Set<string>): boolean {
  if (!entity) {
    return false;
  }
  const family = entity.getComponent(
    EntityComponentTypes.TypeFamily,
  ) as EntityTypeFamilyComponent;
  if (!family || family === null) {
    return false;
  }
  for (let i = 0; i < family.getTypeFamilies().length; i++) {
    if (families.has(family.getTypeFamilies()[i])) {
      return true;
    }
  }
  return false;
}

export function isFamily(entity: Entity, target: string): boolean {
  if (!entity) {
    return false;
  }
  const familyComponent = entity.getComponent(
    EntityComponentTypes.TypeFamily,
  ) as EntityTypeFamilyComponent;
  if (!familyComponent || familyComponent === null) {
    return false;
  }
  const families = familyComponent.getTypeFamilies();
  for (let i = 0; i < families.length; i++) {
    const family = families[i];
    if (family.trim().toLowerCase() === target.trim().toLocaleLowerCase()) {
      return true;
    }
  }
  return false;
}

export function isLoaded(entity: Entity): boolean {
  if (!entity.isValid || !entity?.dimension) {
    return false;
  }
  const entities: Entity[] = entity.dimension.getEntities({
    maxDistance: 1.0,
    location: entity.location,
    families: (
      entity?.getComponent(
        EntityComponentTypes.TypeFamily,
      ) as EntityTypeFamilyComponent
    )?.getTypeFamilies(),
  });
  for (let i = 0; i < entities.length; i++) {
    if (entities[i].id === entity.id) {
      return true;
    }
  }
  return false;
}

export function isUnderground(entity: Entity, distance?: number) {
  if (!distance) {
    distance = 32;
  }
  const dimension = entity.dimension;
  for (let i = 0; i < distance; i++) {
    const block = getBlock(dimension, {
      x: entity.location.x,
      y: entity.location.y + i,
      z: entity.location.z,
    });
    if (isSolid(block)) {
      return true;
    }
  }
  return false;
}
