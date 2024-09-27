import { checkCooldown } from "./item_utils";
import { freezeEntity } from "mob/freeze";
import { isAlive } from "mob/mob_utils";
export const IceDagger = {
    onHitEntity(arg) {
        if (!isAlive(arg.hitEntity)) {
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
        freezeEntity(arg.hitEntity);
    },
};
