import { ItemCustomComponent } from "@minecraft/server";
import { lifesteal } from "entities/functions/lifesteal";
import { dashAttack } from "./dashAttack";

const LIFESTEAL = 1.0;
const LIFESTEAL_KILL = 3.0;
const DASH_DAMAGE = 10;
const DURABILITY_COST = 3;
const DASH_PARTICLE = "minere:darkheart_soul_particle";

export const Darkheart: ItemCustomComponent = {
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
  onUse(arg) {
    const source = arg.source;
    dashAttack(arg, {
      particle: DASH_PARTICLE,
      soundId: "mob.demon.magic",
      soundVolume: 1.5,
      soundPitch: 1.5,
      waveSoundId: "mob.wither.ambient",
      waveSoundVolume: 1.5,
      waveSoundPitch: 1.5,
      damage: DASH_DAMAGE,
      durabilityCost: DURABILITY_COST,
      damageRadius: 1.5,
      cloudDistance: 0.4,
      cloudCount: 2,
      onHit(entity) {
        lifesteal(source, entity, {
          lifesteal: LIFESTEAL,
          lifestealOnKill: LIFESTEAL_KILL,
          subtractHealth: false,
        });
      },
    });
  },
};
