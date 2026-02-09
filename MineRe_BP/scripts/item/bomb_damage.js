import { EntityComponentTypes, } from "@minecraft/server";
import { isAlive } from "mob/mob_utils";
/**
 * Calculates the damage multiplier based on max health.
 */
function damageMultiplier(maxHealth) {
    const multiplier = maxHealth / 180 + 17 / 9;
    return Math.max(1.5, Math.min(4, multiplier));
}
/**
 * Applies bomb/explosive damage to an entity.
 */
export function bombDamage(entity, baseDamage, damageSource) {
    if (!isAlive(entity)) {
        return;
    }
    const health = entity.getComponent(EntityComponentTypes.Health);
    if (!health)
        return;
    const maxHealth = health.effectiveMax;
    const finalDamage = entity.typeId === "minecraft:player"
        ? baseDamage * 1.5
        : baseDamage * damageMultiplier(maxHealth);
    entity?.applyDamage(finalDamage, {
        cause: damageSource?.cause,
        damagingEntity: damageSource?.damagingEntity,
        damagingProjectile: damageSource?.damagingProjectile,
    });
}
