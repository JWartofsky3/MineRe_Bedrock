import { Entity } from "@minecraft/server";

export const IS_SUMMONER = "is_summoner";

export function rollBecomeSummoner(summoner: Entity, chance: number) {
  if (!summoner) {
    return;
  }
  const isSummoner = summoner.getDynamicProperty(IS_SUMMONER);

  if (Math.random() > chance) {
    return;
  }
  if (isSummoner?.valueOf() === 1) {
    return;
  }
  summoner.setDynamicProperty(IS_SUMMONER, 1);

  // DO NOT REMOVE THIS DUMB DUMB
  summoner.triggerEvent("become_summoner");
}
