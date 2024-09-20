import {
  system,
  world,
  EntityComponentTypes,
  ItemStack,
} from "@minecraft/server";
export const replaceMinecart = (data) => {
  if (data.removedEntity.typeId !== "minere:advanced_minecart") {
    return;
  }
  const dimension = world.getDimension(data.removedEntity.dimension.id);
  if (!dimension) {
    return;
  }
  const location = {
    x: data.removedEntity.location.x,
    y: data.removedEntity.location.y,
    z: data.removedEntity.location.z,
  };
  system.run(() => {
    const items = dimension.getEntities({
      type: "minecraft:item",
      closest: 1,
      location: location,
      maxDistance: 3,
    });
    const minecarts = items.filter((entity) => {
      const item = entity.getComponent(EntityComponentTypes.Item);
      if (!item) {
        return false;
      }
      if (item.itemStack.typeId === "minecraft:minecart") {
        return true;
      }
    });
    if (minecarts.length < 1) {
      return;
    }
    const minecart = minecarts[0];
    minecart.remove();
    const advancedMinecartItem = new ItemStack("minere:advanced_minecart", 1);
    dimension.spawnItem(advancedMinecartItem, location);
  });
};
