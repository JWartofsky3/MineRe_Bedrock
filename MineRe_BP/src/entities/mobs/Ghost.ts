import { EntityHurtAfterEvent } from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { applyToolDamageBonus } from "entities/functions/applyDamageBonus";

const GOLD_DAMAGE_BONUS = 6;
const GOLD_PREFIX = "gold:";
export class Ghost extends BaseCustomEntity {
  constructor() {
    super("minere:ghost");
  }

  onEntityHurt = (data: EntityHurtAfterEvent): void => {
    const target = data.hurtEntity;
    const attacker = data.damageSource?.damagingEntity;
    if (!target?.isValid) {
      return;
    }
    applyToolDamageBonus(target, attacker, GOLD_DAMAGE_BONUS, GOLD_PREFIX);
  };
}
