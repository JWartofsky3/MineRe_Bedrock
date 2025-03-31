import {
  ItemCustomComponent,
  EntityComponentTypes,
  EntityTypeFamilyComponent,
  EntityHealthComponent,
} from "@minecraft/server";

const LIFESTEAL = 1.0;
const LIFESTEAL_KILL = 3.0;

export const Darkheart: ItemCustomComponent = {
  onHitEntity(arg) {
    if (!arg.hadEffect || !arg.hitEntity) {
      return;
    }
    const family = arg.hitEntity.getComponent(
      EntityComponentTypes.TypeFamily,
    ) as EntityTypeFamilyComponent;
    const health = arg.hitEntity.getComponent(
      EntityComponentTypes.Health,
    ) as EntityHealthComponent;
    const attackerHealth = arg.attackingEntity.getComponent(
      EntityComponentTypes.Health,
    ) as EntityHealthComponent;
    if (!family || !health) {
      return;
    }
    const typeFamilies = family.getTypeFamilies();
    if (
      typeFamilies.includes("undead") ||
      typeFamilies.includes("zombie") ||
      typeFamilies.includes("skeleton") ||
      typeFamilies.includes("wither") ||
      typeFamilies.includes("inanimate")
    ) {
      return;
    }
    if (health.currentValue > 1) {
      health.setCurrentValue(health.currentValue - LIFESTEAL);
    }
    attackerHealth.setCurrentValue(
      Math.min(
        attackerHealth.effectiveMax,
        attackerHealth.currentValue +
          (health.currentValue > 0 ? LIFESTEAL : LIFESTEAL_KILL),
      ),
    );
  },
};
