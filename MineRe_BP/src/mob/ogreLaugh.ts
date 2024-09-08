import { Entity, world, system } from "@minecraft/server";

export function ogreLaugh(ogre: Entity) {
  if (!ogre || ogre.typeId !== "minere:ogre") {
    return;
  }
  system.runTimeout(() => {
    if (ogre !== null) {
      world.playSound("mob.ogre.laugh", ogre.location);
    }
  }, 3);
}
