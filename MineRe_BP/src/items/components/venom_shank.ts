import { ItemCustomComponent } from "@minecraft/server";

export const VenomShank: ItemCustomComponent = {
  onHitEntity(arg) {
    arg.hitEntity.addEffect("poison", 200, {
      amplifier: 1,
    });
  },
};
