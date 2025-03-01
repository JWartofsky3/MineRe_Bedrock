import {
  system,
  Entity,
  ItemCustomComponent,
  ItemComponentTypes,
  ItemCooldownComponent,
  EntityComponentTypes,
  EntityRidingComponent,
} from "@minecraft/server";
import { reduceDurability } from "./reduce_durability";
import { addVector3, randomVector3 } from "util/vector3Functions";

const UP_DURATION = 20;
const LEVITATION_AMPLIFIER = 9;
const SLOW_FALLING_DELAY = 30;
const SLOW_FALLING_DURATION = 30;
const DURABILITY_COST = 4;

export const Illumina: ItemCustomComponent = {
  onUse(arg) {
    const cooldownComponent = arg.itemStack?.getComponent(
      ItemComponentTypes.Cooldown,
    ) as ItemCooldownComponent;
    if (cooldownComponent) {
      cooldownComponent.startCooldown(arg.source);
    }
    let mount: Entity = undefined;
    const ridingComponent = arg.source.getComponent(
      EntityComponentTypes.Riding,
    ) as EntityRidingComponent;
    if (ridingComponent?.entityRidingOn) {
      mount = ridingComponent.entityRidingOn;
    }
    const dimension = arg.source.dimension;
    reduceDurability(arg.source, arg.itemStack, DURABILITY_COST);
    arg.source.addEffect("levitation", UP_DURATION, {
      amplifier: LEVITATION_AMPLIFIER,
    });
    mount?.addEffect("levitation", UP_DURATION, {
      amplifier: LEVITATION_AMPLIFIER,
    });
    const particleRunner = system.runInterval(() => {
      for (let i = 0; i < 20; i++) {
        try {
          dimension.spawnParticle(
            "minecraft:end_chest",
            addVector3(
              {
                x: arg.source.location.x,
                y: arg.source.location.y + 1,
                z: arg.source.location.z,
              },
              randomVector3(1),
            ),
          );
        } catch {}
      }
    }, 3);
    dimension.playSound("item.illumina.levitate", arg.source.location);
    system.runTimeout(() => {
      arg.source?.addEffect("slow_falling", SLOW_FALLING_DURATION);
      mount?.addEffect("slow_falling", SLOW_FALLING_DURATION);
      system.clearRun(particleRunner);
    }, SLOW_FALLING_DELAY);
  },
};
