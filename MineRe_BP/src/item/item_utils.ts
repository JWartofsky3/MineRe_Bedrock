import { Dimension, ItemStack, Vector3, Entity, EntityComponentTypes, EntityItemComponent } from "@minecraft/server";

export function getItem(dimension: Dimension, location: Vector3, typeId: string): Entity | undefined {
    const allItems = dimension.getEntities({
        type: "minecraft:item",
        closest: 1,
        location: location,
        maxDistance: 2,
      }) as Entity[];
      const items = allItems.filter((entity: Entity) => {
        const item = entity.getComponent(
          EntityComponentTypes.Item,
        ) as EntityItemComponent;
        if (!item) {
          return false;
        }
        if (item.itemStack.typeId === typeId) {
          return true;
        }
      });
      if (items.length < 1) {
        return;
      }
      return items[0];
}

