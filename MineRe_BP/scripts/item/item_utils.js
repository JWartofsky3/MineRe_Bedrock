import { EntityComponentTypes, Player, ItemComponentTypes, } from "@minecraft/server";
import { isAlive } from "mob/mob_utils";
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
export function checkCooldown(item, entity) {
    if (!(entity instanceof Player)) {
        return false;
    }
    if (!isAlive(entity)) {
        return false;
    }
    const player = entity;
    const cooldownComponent = item?.getComponent(ItemComponentTypes.Cooldown);
    if (!cooldownComponent ||
        cooldownComponent.getCooldownTicksRemaining(player) > 0) {
        return false;
    }
    cooldownComponent.startCooldown(player);
    return true;
}
