import {
  Entity,
  system,
  EntityComponentTypes,
  EntityHealthComponent,
} from "@minecraft/server";
import { isAlive } from "./mob_utils";

export function ogreLaugh(ogre: Entity, deadEntity: Entity) {
  if (!ogre || ogre.typeId !== "minere:ogre") {
    return;
  }

  if (!isAlive(ogre)) {
    return;
  }

  const health = deadEntity?.getComponent(
    EntityComponentTypes.Health,
  ) as EntityHealthComponent;
  if (health?.effectiveMax < 10) {
    return;
  }
  system.runTimeout(() => {
    if (ogre !== null) {
      ogre.dimension.playSound("mob.ogre.laugh", ogre.location);
    }
  }, 3);
}
