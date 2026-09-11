import { ItemCustomComponent, Player } from "@minecraft/server";
import { triggerDarkChargeEffect } from "entities/projectiles/DarkCharge";

const DARK_CHARGE_ITEM_ID = "minere:dark_charge";
export const DarkChargeItem: ItemCustomComponent = {
  onUseOn(arg) {
    if (!(arg.source instanceof Player)) {
      return;
    }

    if (!arg.block.isValid) {
      return;
    }

    const targetLocation = {
      x: arg.block.location.x + 0.5,
      y: arg.block.location.y + 1,
      z: arg.block.location.z + 0.5,
    };
    arg.source.dimension.playSound("item.shadow_staff.whoosh", targetLocation);
    triggerDarkChargeEffect(
      arg.source.dimension,
      targetLocation,
      arg.source.id,
      true,
      2,
    );
    arg.source.runCommand(`clear @s[m=!c] ${DARK_CHARGE_ITEM_ID} 0 1`);
  },
};
