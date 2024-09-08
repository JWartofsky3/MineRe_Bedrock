import { EntityComponentTypes, } from "@minecraft/server";
export function bombDamage(entity, damage) {
    const health = entity?.getComponent(EntityComponentTypes.Health);
    if (!health) {
        return;
    }
    if (entity.typeId === "minecraft:player") {
        health.setCurrentValue(health.currentValue - damage * 0.5);
    }
    else {
        health.setCurrentValue(health.currentValue - damage * 1.0);
    }
}
