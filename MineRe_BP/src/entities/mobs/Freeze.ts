import { EntityHurtAfterEvent } from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { rollFreeze } from "entities/functions/freeze";
import { isAlive } from "entities/utilities/common";

export class Freeze extends BaseCustomEntity {
  constructor() {
    super("minere:freeze");
  }

  onEntityHurtEntity = (data: EntityHurtAfterEvent): void => {
    const target = data.hurtEntity;
    if (!isAlive(target)) {
      return;
    }
    rollFreeze(target);
  };
}
