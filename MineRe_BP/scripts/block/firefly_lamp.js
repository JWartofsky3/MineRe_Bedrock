import { EntityComponentTypes, ItemComponentTypes, EquipmentSlot, } from "@minecraft/server";
import { getItem } from "item/item_utils";
export const fireflyLamp = {
    onPlayerDestroy(arg) {
        const player = arg.player;
        if (!player) {
            return;
        }
        const dimension = player.dimension;
        const typeId = arg.destroyedBlockPermutation.getItemStack().typeId;
        const equipment = player.getComponent(EntityComponentTypes.Equippable);
        if (!equipment) {
            return;
        }
        const item = equipment.getEquipmentSlot(EquipmentSlot.Mainhand)?.getItem();
        if (!item) {
            return;
        }
        const durability = item.getComponent(ItemComponentTypes.Durability);
        if (!durability) {
            return;
        }
        const enchantable = item.getComponent(ItemComponentTypes.Enchantable);
        if (!enchantable || !enchantable.hasEnchantment("silk_touch")) {
            const fireflyLamp = getItem(dimension, arg.block.location, typeId);
            let spawnEvent = "spawn green";
            switch (typeId) {
                case "minere:yellow_firefly_lamp":
                    spawnEvent = "spawn_yellow";
                    break;
                case "minere:purple_firefly_lamp":
                    spawnEvent = "spawn_purple";
                    break;
                case "minere:blue_firefly_lamp":
                    spawnEvent = "spawn_blue";
                    break;
            }
            if (fireflyLamp) {
                fireflyLamp.remove();
                dimension.runCommand(`summon minere:firefly ${arg.block.location.x} ${arg.block.location.y} ${arg.block.location.z} 0 0 ${spawnEvent}`);
            }
        }
    },
};
