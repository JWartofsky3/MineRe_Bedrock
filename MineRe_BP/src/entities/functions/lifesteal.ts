import {
  Entity,
  EntityComponentTypes,
  EntityTypeFamilyComponent,
  EntityHealthComponent,
} from "@minecraft/server";
import { getHealth } from "entities/utilities/common";

export type LifestealOptions = {
  lifesteal: number;
  subtractHealth: boolean;
  lifestealOnKill?: number;
  blockedFamilies?: string[];
};

const DEFAULT_BLOCKED = ["undead", "zombie", "skeleton", "wither", "inanimate"];

export function lifesteal(
  attacker: Entity,
  target: Entity,
  options: LifestealOptions,
): void {
  if (!attacker || !target) {
    return;
  }

  const family = target.getComponent(
    EntityComponentTypes.TypeFamily,
  ) as EntityTypeFamilyComponent;
  const targetHealth = getHealth(target);
  const attackerHealth = getHealth(attacker);

  if (!family || !targetHealth || !attackerHealth) {
    return;
  }

  const blocked = options.blockedFamilies ?? DEFAULT_BLOCKED;
  const typeFamilies = family.getTypeFamilies();
  if (typeFamilies.some((f) => blocked.includes(f))) {
    return;
  }

  if (options.subtractHealth && targetHealth.currentValue > 1) {
    const nextValue = Math.max(
      1,
      targetHealth.currentValue - options.lifesteal,
    );
    targetHealth.setCurrentValue(nextValue);
  }

  const healAmount =
    targetHealth.currentValue > 0
      ? options.lifesteal
      : options.lifestealOnKill ?? options.lifesteal;

  attackerHealth.setCurrentValue(
    Math.min(
      attackerHealth.effectiveMax,
      attackerHealth.currentValue + healAmount,
    ),
  );
}
