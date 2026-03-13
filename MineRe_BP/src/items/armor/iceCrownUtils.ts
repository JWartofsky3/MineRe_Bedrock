import {
  Entity,
  EntityComponentTypes,
  EntityEquippableComponent,
  EquipmentSlot,
} from "@minecraft/server";
import { isAlive } from "mob/mob_utils";

export const ICE_CROWN_ITEM_ID = "minere:ice_crown";

export function isWearingIceCrown(entity: Entity): boolean {
  if (!isAlive(entity)) {
    return false;
  }

  const equippable = entity.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;
  if (!equippable) {
    return false;
  }

  const helmet = equippable.getEquipment(EquipmentSlot.Head);
  if (helmet?.typeId !== ICE_CROWN_ITEM_ID) {
    return false;
  }

  return true;
}
