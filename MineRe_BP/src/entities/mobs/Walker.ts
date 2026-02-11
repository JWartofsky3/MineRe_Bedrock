import { EntityHurtAfterEvent } from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { throwEntity } from "entities/functions/throw";
import { isAlive } from "entities/utilities/common";
const THROW_DISTANCE_SCALE = 1.25;
const THROW_VERTICAL = 1.0;

export class Walker extends BaseCustomEntity {
  constructor() {
    super("minere:walker");
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
