import { world, system, EntityComponentTypes, ItemStack, } from "@minecraft/server";
import { getItem } from "../item/item_utils";
export const horseRemoveChest = (data) => {
    if (data.deadEntity.typeId !== "minecraft:horse") {
        return;
    }
    const dimension = world.getDimension(data.deadEntity.dimension.id);
    if (!dimension) {
        return;
    }
    const location = {
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
            const itemComponent = item.getComponent(EntityComponentTypes.Item);
            if (!itemComponent?.isValid) {
                return;
            }
            const amount = itemComponent.itemStack.amount;
            item.remove();
            if (amount == 1) {
                return;
            }
            dimension.spawnItem(new ItemStack("minecraft:chest", amount - 1), location);
        }
    }, 2);
};
