import { EntityHurtAfterEvent } from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { enderRandomTeleport } from "entities/functions/enderTeleport";

export class EnderPhantom extends BaseCustomEntity {
  constructor() {
    super("minere:ender_phantom");
  }

  onEntityHurtEntity = (data: EntityHurtAfterEvent): void => {
    const attacker = data.damageSource?.damagingEntity;
    enderRandomTeleport(attacker, 40, 0.35, 4);
  };

  onEntityHurt(data: EntityHurtAfterEvent): void {
    const target = data.hurtEntity;
    enderRandomTeleport(target, 40, 0.35, 4);
  }
}
