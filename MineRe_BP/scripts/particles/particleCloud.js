import { randomVector3, addVector3 } from "util/vector3Functions";
export function spawnParticleCloud(
  particle,
  location,
  distance,
  count,
  dimension,
) {
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
