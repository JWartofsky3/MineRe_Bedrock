import {
  system,
  world,
  Entity,
  EntityRemoveBeforeEvent,
  EntityComponentTypes,
  ItemStack,
  Vector3,
  EntityItemComponent,
} from "@minecraft/server";
import { getItem } from "./item_utils";

export const replaceMinecart = (data: EntityRemoveBeforeEvent) => {
  if (data.removedEntity.typeId !== "minere:advanced_minecart") {
    return;
  }

  const dimension = world.getDimension(data.removedEntity.dimension.id);
  if (!dimension) {
    return;
  }

  const location: Vector3 = {
    x: data.removedEntity.location.x,
    y: data.removedEntity.location.y,
    z: data.removedEntity.location.z,
  };
  system.run(() => {
    const minecart = getItem(dimension, location, "minecraft:minecart");
    if (minecart) {
      minecart.remove();
      const advancedMinecartItem = new ItemStack("minere:advanced_minecart", 1);
      dimension.spawnItem(advancedMinecartItem, location);
    }
  });
};
