import { world } from "@minecraft/server";

export function isDay(): boolean {
  const time = world.getTimeOfDay();
  return time < 13000 || time > 23000;
}
