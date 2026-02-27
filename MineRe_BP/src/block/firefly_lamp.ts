import {
  EntityComponentTypes,
  ItemComponentTypes,
  Player,
  BlockCustomComponent,
  BlockComponentPlayerBreakEvent,
  EntityEquippableComponent,
  EquipmentSlot,
  ItemEnchantableComponent,
  ItemDurabilityComponent,
} from "@minecraft/server";
import { getItem } from "items/components/item_utils";

export const fireflyLamp: BlockCustomComponent = {
  onPlayerBreak(arg: BlockComponentPlayerBreakEvent) {
    const player: Player = arg.player;
    if (!player) {
      return;
    }
    const dimension = player.dimension;
    const typeId = arg.brokenBlockPermutation.getItemStack().typeId;
    const equipment = player.getComponent(
      EntityComponentTypes.Equippable,
    ) as EntityEquippableComponent;
    if (!equipment) {
      return;
    }
    const item = equipment.getEquipmentSlot(EquipmentSlot.Mainhand)?.getItem();
    if (!item) {
      return;
    }
    const durability = item.getComponent(
      ItemComponentTypes.Durability,
    ) as ItemDurabilityComponent;
    if (!durability) {
      return;
    }
    const enchantable = item.getComponent(
      ItemComponentTypes.Enchantable,
    ) as ItemEnchantableComponent;
    if (!enchantable || !enchantable.hasEnchantment("silk_touch")) {
      const fireflyLamp = getItem(dimension, arg.block.location, typeId);
      let spawnEvent = "spawn_green";
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
        dimension.runCommand(
          `summon minere:firefly ${arg.block.location.x} ${arg.block.location.y} ${arg.block.location.z} 0 0 ${spawnEvent}`,
        );
      }
    }
  },
};
