import { world, EntityHurtAfterEvent } from "@minecraft/server";
import { enderRandomTeleport } from "entities/functions/enderTeleport";
import { isAlive } from "mob/mob_utils";

export class EndermanTeleportTargetEvent {
  constructor() {
    world.afterEvents.entityHurt.subscribe(handleEndermanTeleportTarget);
  }

  register(): void {
    // Registration is handled in the constructor.
  }
}

function handleEndermanTeleportTarget(data: EntityHurtAfterEvent) {
  const target = data.hurtEntity;
  const attacker = data.damageSource?.damagingEntity;
  const projectile = data.damageSource?.damagingProjectile;

  if (!isAlive(target) || !isAlive(attacker)) {
    return;
  }

  if (attacker?.typeId === "minecraft:enderman") {
    enderRandomTeleport(target, 5, 0.25, 0);
  }

  if (attacker?.typeId === "minecraft:ender_dragon" && !projectile) {
    enderRandomTeleport(target, 7, 0.5, 0);
  }
}
