import {
  EntityComponentTypes,
  EntityEquippableComponent,
  EquipmentSlot,
  ItemCustomComponent,
  ItemStack,
} from "@minecraft/server";
import { showHint } from "items/staves/staffHints";

type BossTotemSwapDefinition = {
  hintKey: string;
  replacementTypeId: string;
  soundId: string;
};

const bossTotemSwaps = new Map<string, BossTotemSwapDefinition>();
bossTotemSwaps.set("minere:inferno_totem", {
  hintKey: "hint.minere:inferno_ward",
  replacementTypeId: "minere:inferno_ward",
  soundId: "item.amethyst_staff.error",
});
bossTotemSwaps.set("minere:inferno_ward", {
  hintKey: "hint.minere:inferno_totem",
  replacementTypeId: "minere:inferno_totem",
  soundId: "item.fire_staff.cast",
});
bossTotemSwaps.set("minere:glacier_totem", {
  hintKey: "hint.minere:glacier_ward",
  replacementTypeId: "minere:glacier_ward",
  soundId: "item.amethyst_staff.error",
});
bossTotemSwaps.set("minere:glacier_ward", {
  hintKey: "hint.minere:glacier_totem",
  replacementTypeId: "minere:glacier_totem",
  soundId: "item.ice_charge.frost",
});

export const BossTotem: ItemCustomComponent = {
  onUse(arg) {
    const equippable = arg.source.getComponent(
      EntityComponentTypes.Equippable,
    ) as EntityEquippableComponent;
    if (!equippable) {
      return;
    }

    const swapDefinition = bossTotemSwaps.get(arg.itemStack?.typeId);
    if (!swapDefinition) {
      return;
    }

    const mainhand = equippable.getEquipment(EquipmentSlot.Mainhand);
    if (mainhand?.typeId !== arg.itemStack?.typeId) {
      return;
    }

    arg.source.playSound(swapDefinition.soundId);
    equippable.setEquipment(
      EquipmentSlot.Mainhand,
      new ItemStack(swapDefinition.replacementTypeId, 1),
    );
    showHint(arg.source, swapDefinition.hintKey, 20 * 2);
  },
};
