import { ItemComponentTypes, } from "@minecraft/server";
const XP_COST = 1;
export const fireInfintyBowAfter = (data) => {
    const dimension = data.source.dimension;
    if (data.itemStack.typeId !== "minecraft:bow" || dimension == null) {
        return;
    }
    const enchantments = data.itemStack.getComponent(ItemComponentTypes.Enchantable);
    if (!enchantments || !enchantments.getEnchantment("infinity")) {
        return;
    }
    if (data.source.getTotalXp() < XP_COST) {
        const items = dimension.getEntities({
            type: "arrow",
            closest: 1,
            location: data.source.location,
            maxDistance: 5,
        });
        if (items.length) {
            dimension.spawnParticle("minecraft:dust_plume", items[0].location);
            items[0].remove();
        }
        data.source.playSound("item.amethyst_staff.error");
    }
    if (data.source.getTotalXp() == 0) {
        return;
    }
    if (data.source.xpEarnedAtCurrentLevel == 0) {
        data.source.addLevels(-1);
        data.source.addExperience(data.source.totalXpNeededForNextLevel - XP_COST);
    }
    else {
        data.source.addExperience(-1 * XP_COST);
    }
};
