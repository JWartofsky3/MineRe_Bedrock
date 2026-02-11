import { system } from "@minecraft/server";
import { freezeEntity, rollFreeze } from "mob/freeze";
import { spawnParticleCloud } from "particles/particleCloud";
import { iceCharge } from "./ice_charge";
import { distVector3 } from "util/vector3Functions";
const RADIUS = 6;
const DURATION = 16;
export const iceBomb = (data) => {
  const location = data.removedEntity.location;
  const dimension = data.removedEntity.dimension;
  if (data.removedEntity.typeId !== "minere:ice_bomb") {
    return;
  }
  system.run(() => {
    iceCharge(dimension, location, RADIUS, true);
    const entities = dimension.getEntities({
      location: location,
      maxDistance: RADIUS,
    });
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      if (!entity) {
        continue;
      }
      const distance = distVector3(entity.location, location);
      if (distance < RADIUS * 0.6) {
        freezeEntity(entity, DURATION);
      } else {
        rollFreeze(entity, 0.075);
      }
    }
    dimension.playSound("item.ice_charge.frost", location, { volume: 2.25 });
    spawnParticleCloud(
      "minere:ice_charge_particles",
      location,
      RADIUS,
      60,
      dimension,
    );
  });
};
