import { world, system } from "@minecraft/server";
import { distVector3 } from "util/vector3Functions";
export const handleEndSpawn = (entity) => {
  if (!entity?.dimension) {
    return;
  }
  if (!entity?.typeId) {
    return;
  }
  if (
    !(
      entity.typeId == "minere:walker" ||
      entity.typeId == "minere:cosmic_jelly" ||
      entity.typeId == "minere:cosmic_jelly_placeholder" ||
      entity.typeId == "minere:ender_phantom" ||
      entity.typeId == "minere:gremlin"
    )
  ) {
    return;
  }
  const dimension = world.getDimension(entity?.dimension?.id);
  if (dimension?.id !== "minecraft:the_end") {
    return;
  }
  system.run(() => {
    if (!entity?.typeId) {
      return;
    }
    const location = entity.location;
    const distance = distVector3(entity.location, { x: 0, y: 0, z: 0 });
    // replace walkers, comsic_jellies, and gremlins on the main island
    if (distance < 1000) {
      if (
        entity.typeId == "minere:walker" ||
        entity.typeId == "minere:cosmic_jelly_placeholder"
      ) {
        entity.remove();
        dimension.spawnEntity("minecraft:enderman", location);
      }
      // replace gremlins with endermen on the main island
      if (entity.typeId == "minere:gremlin") {
        entity.remove();
        if (Math.random() <= 0.5) {
          dimension.spawnEntity("minecraft:enderman", location);
        }
      }
      return;
    }
    if (entity.typeId === "minere:cosmic_jelly_placeholder") {
      entity.remove();
      dimension.spawnEntity("minere:cosmic_jelly", location);
    }
  });
};
