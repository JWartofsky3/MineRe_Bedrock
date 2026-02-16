import { Entity, system } from "@minecraft/server";

export function isOffCooldown(
  entity: Entity,
  cooldownProp: string,
  expectedTicks: number,
): boolean {
  const propKey = cooldownProp.startsWith("minere:")
    ? cooldownProp
    : `minere:${cooldownProp}`;

  const storedValue = entity.getDynamicProperty(propKey);

  if (typeof storedValue !== "number") {
    return true;
  }

  const elapsedTicks = system.currentTick - storedValue;

  if (elapsedTicks >= expectedTicks) {
    return true;
  }

  return false;
}
