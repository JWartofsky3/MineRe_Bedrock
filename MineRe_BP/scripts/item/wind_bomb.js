import { system } from "@minecraft/server";
import { throwByPos } from "mob/throwBy";
import { spawnParticleCloud } from "particles/particleCloud";
import { distVector3 } from "util/vector3Functions";
export const windBomb = (data) => {
  const location = data.removedEntity.location;
  const dimension = data.removedEntity.dimension;
  if (data.removedEntity.typeId !== "minere:wind_bomb") {
    return;
  }
  const maxRadius = 8;
  const baseForce = 8;
  const baseVertical = 3;
  system.run(() => {
    const entities = dimension.getEntities({
      location,
      maxDistance: maxRadius,
    });
    for (const entity of entities) {
      if (!entity) continue;
      const distance = distVector3(entity.location, location);
      // 1 → center, ~0.33 → edge
      const distanceScale = Math.max(0.33, 1 - distance / maxRadius);
      try {
        throwByPos(
          location,
          entity,
          baseForce * distanceScale,
          baseVertical * distanceScale,
        );
        dimension.spawnParticle(
          "minecraft:wind_charged_emitter",
          entity.location,
        );
        dimension.playSound("wind_charge.burst", entity.location);
      } catch (err) {
        // ignore
      }
    }
    dimension.playSound("breeze_wind_charge.burst", location, {
      volume: 2.25,
    });
    spawnParticleCloud(
      "minecraft:wind_explosion_emitter",
      location,
      maxRadius / 3,
      5,
      dimension,
    );
    system.runTimeout(() => {
      spawnParticleCloud(
        "minecraft:wind_explosion_emitter",
        location,
        maxRadius,
        25,
        dimension,
      );
    }, 3);
  });
};
