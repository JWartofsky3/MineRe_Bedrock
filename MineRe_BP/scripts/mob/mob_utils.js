import { EntityComponentTypes, } from "@minecraft/server";
import { getBlock, isSolid } from "block/blockUtils";
export function isAlive(entity) {
    if (!entity || !entity?.isValid) {
        return false;
    }
    const health = entity?.getComponent(EntityComponentTypes.Health);
    if (!health) {
        return false;
    }
    return health.currentValue > 0;
}
export function isFamilySet(entity, families) {
    if (!entity) {
        return false;
    }
    const family = entity.getComponent(EntityComponentTypes.TypeFamily);
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
export function isFamily(entity, target) {
    if (!entity) {
        return false;
    }
    const familyComponent = entity.getComponent(EntityComponentTypes.TypeFamily);
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
export function isLoaded(entity) {
    if (!entity.isValid || !entity?.dimension) {
        return false;
    }
    const entities = entity.dimension.getEntities({
        maxDistance: 1.0,
        location: entity.location,
        families: entity?.getComponent(EntityComponentTypes.TypeFamily)?.getTypeFamilies(),
    });
    for (let i = 0; i < entities.length; i++) {
        if (entities[i].id === entity.id) {
            return true;
        }
    }
    return false;
}
export function isUnderground(entity, distance) {
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
