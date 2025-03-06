import { EntityComponentTypes, } from "@minecraft/server";
export function isAlive(entity) {
    if (!entity) {
        return false;
    }
    const health = entity?.getComponent(EntityComponentTypes.Health);
    if (!health) {
        return false;
    }
    return health.currentValue > 0;
}
export function isFamily(entity, families) {
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
export function isLoaded(entity) {
    if (!entity.isValid() || !entity?.dimension) {
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
