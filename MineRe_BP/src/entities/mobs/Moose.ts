import { EntityHurtAfterEvent } from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { throwEntity } from "entities/functions/throw";
import { isAlive } from "entities/utilities/common";
const THROW_DISTANCE_SCALE = 2.0;
const THROW_VERTICAL = 0.5;

export class Moose extends BaseCustomEntity {
  constructor() {
    super("minere:moose");
  }

  onEntityHurtEntity = (data: EntityHurtAfterEvent): void => {
    const attacker = data.damageSource?.damagingEntity;
    const target = data.hurtEntity;
    if (!isAlive(attacker) || !isAlive(target)) {
      return;
    }
    throwEntity(
      attacker.location,
      target,
      THROW_DISTANCE_SCALE,
      THROW_VERTICAL,
    );
  };
}
