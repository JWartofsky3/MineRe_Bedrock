import { EntityComponentTypes } from "@minecraft/server";
export function getItem(dimension, location, typeId) {
    const allItems = dimension.getEntities({
        type: "minecraft:item",
        closest: 1,
        location: location,
        maxDistance: 2,
    });
    const items = allItems.filter((entity) => {
        const item = entity.getComponent(EntityComponentTypes.Item);
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
