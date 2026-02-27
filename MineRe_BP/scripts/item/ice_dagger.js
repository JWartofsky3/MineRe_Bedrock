import { checkCooldown } from "./item_utils";
import { freezeEntity } from "entities/functions/freeze";
import { isAlive } from "mob/mob_utils";
export const IceDagger = {
  onHitEntity(arg) {
    if (!isAlive(arg.hitEntity)) {
      return;
    }
    if (arg.hitEntity.typeId.includes("freeze")) {
      return;
    }
    arg.hitEntity.addEffect("slowness", 160, {
      amplifier: 0,
    });
    if (!checkCooldown(arg.itemStack, arg.attackingEntity)) {
      return;
    }
    arg.hitEntity.addEffect("slowness", 160, {
      amplifier: 3,
    });
    freezeEntity(arg.hitEntity, 22);
  },
};
