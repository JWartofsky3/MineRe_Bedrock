import { ItemCustomComponent } from "@minecraft/server";
import { spawnParticleCloud } from "particles/particleCloud";

const HIT_PARTICLE = "minere:poison_particle";

export const VenomSpear: ItemCustomComponent = {
  onHitEntity(arg) {
    spawnParticleCloud(HIT_PARTICLE, arg.hitEntity.location, 2, 5, arg.hitEntity.dimension);
    arg.hitEntity.addEffect("poison", 200, {
      amplifier: 1,
    });
  },
};
