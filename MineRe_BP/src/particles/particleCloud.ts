import { Dimension, Vector3 } from "@minecraft/server";
import { randomVector3, addVector3 } from "util/vector3Functions";

export function spawnParticleCloud(
  particle: string,
  location: Vector3,
  distance: number,
  count: number,
  dimension: Dimension,
): boolean {
  for (let i = 0; i < count; i++) {
    try {
      const { x, y, z } = addVector3(location, randomVector3(distance));
      dimension.runCommand(`particle ${particle} ${x} ${y} ${z}`);
    } catch {
      return false;
    }
  }
  return true;
}
