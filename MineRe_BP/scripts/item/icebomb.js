import { system } from "@minecraft/server";
import { freezeEntity } from "mob/freeze";
import { spawnParticleCloud } from "particles/particleCloud";
import { iceCharge } from "./ice_charge";
const RADIUS = 7;
const DURATION = 16;
export const ice_bomb = (data) => {
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
      freezeEntity(entity, DURATION);
    }
    dimension.playSound("item.ice_charge.frost", location, { volume: 2.25 });
    spawnParticleCloud(
      "minere:ice_charge_particles",
      location,
      RADIUS,
      100,
      dimension,
    );
  });
};
