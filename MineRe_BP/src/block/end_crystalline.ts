import {
  system,
  BlockCustomComponent,
  BlockComponentEntityFallOnEvent,
} from "@minecraft/server";

const EFFECT_DURATION = 100;

export const endCrystalline: BlockCustomComponent = {
  onEntityFallOn(arg: BlockComponentEntityFallOnEvent) {
    const entity = arg.entity;
    if (entity?.typeId === "minecraft:player") {
      entity.addEffect("nausea", EFFECT_DURATION, {
        amplifier: 2,
        showParticles: false,
      });
    }
  },
};
