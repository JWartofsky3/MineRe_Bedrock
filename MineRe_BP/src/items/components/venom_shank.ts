import { ItemCustomComponent } from "@minecraft/server";
import { dashAttack } from "./dashAttack";
import { spawnParticleCloud } from "particles/particleCloud";

const DASH_DAMAGE = 7;
const POISON_DURATION = 20 * 6;
const DURABILITY_COST = 2;
const DASH_PARTICLE = "minere:poison_particle";
const HIT_PARTICLE = "minere:poison_particle";

export const VenomShank: ItemCustomComponent = {
  onHitEntity(arg) {
    spawnParticleCloud(HIT_PARTICLE, arg.hitEntity.location, 2, 5, arg.hitEntity.dimension);
    arg.hitEntity.addEffect("poison", 200, {
      amplifier: 1,
    });
  },
  onUse(arg) {
    dashAttack(arg, {
      particle: DASH_PARTICLE,
      soundId: "item.sword.swoosh",
      soundVolume: 1.25,
      waveSoundId: "boss.inferno.swing",
      waveSoundVolume: 1.0,
      damage: DASH_DAMAGE,
      durabilityCost: DURABILITY_COST,
      damageRadius: 1.5,
      cloudDistance: 0.5,
      cloudCount: 3,
      onHit(entity) {
        entity.addEffect("poison", POISON_DURATION, {
          amplifier: 1,
        });
      },
    });
  },
};
