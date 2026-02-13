import { world, EntityHurtAfterEvent } from "@minecraft/server";
import { RegisterableEvent } from "events/CustomEvent";
import { isAlive } from "mob/mob_utils";

export class CreakingApplyEffectsEvent implements RegisterableEvent {
  constructor() {
    world.afterEvents.entityHurt.subscribe(creakingApplyWither);
  }

  register(): void {
    // Registration is handled in the constructor.
  }
}

function creakingApplyWither(data: EntityHurtAfterEvent) {
  const target = data.hurtEntity;
  const attacker = data.damageSource?.damagingEntity;

  if (!isAlive(target) || !isAlive(attacker)) {
    return;
  }

  if (attacker?.typeId === "minecraft:creaking" && Math.random() < 0.5) {
    target.addEffect("wither", 80);
  }
}
