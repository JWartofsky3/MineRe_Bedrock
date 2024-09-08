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
    const items = dimension.getEntities({
      type: "minecraft:item",
      closest: 1,
      location: location,
      maxDistance: 3,
    }) as Entity[];
    const minecarts = items.filter((entity: Entity) => {
      const item = entity.getComponent(
        EntityComponentTypes.Item,
      ) as EntityItemComponent;
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
