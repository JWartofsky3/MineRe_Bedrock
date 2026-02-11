import { lifesteal } from "entities/functions/lifesteal";
const LIFESTEAL = 1.0;
const LIFESTEAL_KILL = 3.0;
export const Darkheart = {
    onHitEntity(arg) {
        if (!arg.hadEffect || !arg.hitEntity) {
            return;
        }
        lifesteal(arg.attackingEntity, arg.hitEntity, {
            lifesteal: LIFESTEAL,
            lifestealOnKill: LIFESTEAL_KILL,
            subtractHealth: true,
        });
    },
};
