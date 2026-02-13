import {
  world,
  system,
  EntityComponentTypes,
  ItemStack,
  Vector3,
  EntityItemComponent,
  EntityDieAfterEvent,
} from "@minecraft/server";
import { RegisterableEvent } from "events/CustomEvent";
import { getItem } from "item/item_utils";

export class HorseDieRemoveChestEvent implements RegisterableEvent {
  constructor() {
    world.afterEvents.entityDie.subscribe(horseRemoveChest);
  }

  register(): void {
    // Registration is handled in the constructor.
  }
}

export const horseRemoveChest = (data: EntityDieAfterEvent) => {
  if (data.deadEntity.typeId !== "minecraft:horse") {
    return;
  }
  const dimension = world.getDimension(data.deadEntity.dimension.id);
  if (!dimension) {
    return;
  }

  const location: Vector3 = {
    x: data.deadEntity.location.x,
    y: data.deadEntity.location.y,
    z: data.deadEntity.location.z,
  };

  system.runTimeout(() => {
    const item = getItem(dimension, location, "minecraft:chest");
    if (!item) {
      return;
    }
    if (item) {
      const itemComponent = item.getComponent(
        EntityComponentTypes.Item,
      ) as EntityItemComponent;
      if (!itemComponent?.isValid) {
        return;
      }
      const amount = itemComponent.itemStack.amount;
      item.remove();
      if (amount == 1) {
        return;
      }
      dimension.spawnItem(
        new ItemStack("minecraft:chest", amount - 1),
        location,
      );
    }
  }, 2);
};
