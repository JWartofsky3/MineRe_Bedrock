import {
  EntityComponentTypes,
  EntityEquippableComponent,
  EquipmentSlot,
  ItemCustomComponent,
  ItemStack,
} from "@minecraft/server";

const INFERNO_TOTEM_ID = "minere:inferno_totem";
const INFERNO_WARD_ID = "minere:inferno_ward";

export const InfernoTotem: ItemCustomComponent = {
  onUse(arg) {
    const equippable = arg.source.getComponent(
      EntityComponentTypes.Equippable,
    ) as EntityEquippableComponent;
    if (!equippable) {
      return;
    }

    const replacementTypeId = getReplacementTypeId(arg.itemStack?.typeId);
    if (!replacementTypeId) {
      return;
    }

    const replacementItem = new ItemStack(replacementTypeId, 1);
    const mainhand = equippable.getEquipment(EquipmentSlot.Mainhand);
    if (mainhand?.typeId === arg.itemStack?.typeId) {
        if (replacementItem.typeId === INFERNO_TOTEM_ID) {
            arg.source.playSound("item.fire_staff.cast");
        } else {
            arg.source.playSound("item.amethyst_staff.error")
        }
      equippable.setEquipment(EquipmentSlot.Mainhand, replacementItem);
      return;
    }
  },
};

function getReplacementTypeId(typeId?: string): string | undefined {
  if (typeId === INFERNO_TOTEM_ID) {
    return INFERNO_WARD_ID;
  }
  if (typeId === INFERNO_WARD_ID) {
    return INFERNO_TOTEM_ID;
  }

  return undefined;
}
