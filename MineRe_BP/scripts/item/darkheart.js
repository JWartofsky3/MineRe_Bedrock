import { EntityComponentTypes, } from "@minecraft/server";
const LIFESTEAL = 1.0;
const LIFESTEAL_KILL = 3.0;
export const Darkheart = {
    onHitEntity(arg) {
        if (!arg.hadEffect || !arg.hitEntity) {
            return;
        }
        const family = arg.hitEntity.getComponent(EntityComponentTypes.TypeFamily);
        const health = arg.hitEntity.getComponent(EntityComponentTypes.Health);
        const attackerHealth = arg.attackingEntity.getComponent(EntityComponentTypes.Health);
        if (!family || !health) {
            return;
        }
        const typeFamilies = family.getTypeFamilies();
        if (typeFamilies.includes("undead") ||
            typeFamilies.includes("zombie") ||
            typeFamilies.includes("skeleton") ||
            typeFamilies.includes("wither") ||
            typeFamilies.includes("inanimate")) {
            return;
        }
        if (health.currentValue > 1) {
            health.setCurrentValue(health.currentValue - LIFESTEAL);
        }
        attackerHealth.setCurrentValue(Math.min(attackerHealth.effectiveMax, attackerHealth.currentValue +
            (health.currentValue > 0 ? LIFESTEAL : LIFESTEAL_KILL)));
    },
};
