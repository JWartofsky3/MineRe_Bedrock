import { system, InvalidEntityError, world } from "@minecraft/server";
import { throwByPos } from "mob/throwBy";
import { spawnParticleCloud } from "particles/particleCloud";
export const wind_bomb = (data) => {
  const location = data.removedEntity.location;
  const dimension = data.removedEntity.dimension;
  if (data.removedEntity.typeId !== "minere:wind_bomb") {
    return;
  }
  system.run(() => {
    const entities = dimension.getEntities({
      location: location,
      maxDistance: 7,
    });
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      if (!entity) {
        continue;
      }
      try {
        throwByPos(location, entity, 7, 2);
        dimension.spawnParticle(
          "minecraft:wind_charged_emitter",
          entity.location,
        );
        dimension.playSound("wind_charge.burst", entity.location);
      } catch (err) {
        if (err instanceof InvalidEntityError) {
          world.sendMessage(`invalid entity type ${entity.typeId}`);
        }
      }
    }
    dimension.playSound("breeze_wind_charge.burst", location, { volume: 2.25 });
    spawnParticleCloud(
      "minecraft:wind_charged_emitter",
      location,
      7,
      20,
      dimension,
    );
  });
};
