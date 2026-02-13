import { EntityHurtAfterEvent, EntitySpawnAfterEvent } from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { applyBombDamageBonus } from "entities/functions/applyDamageBonus";
import { isAlive } from "entities/utilities/common";

const BOMB_TYPE_ID = "minere:bomb";
const FUSE_SOUND_ID = "random.fuse";

export class Bomb extends BaseCustomEntity {
  constructor() {
    super(BOMB_TYPE_ID);
  }

  onEntitySpawn = (data: EntitySpawnAfterEvent): void => {
    const entity = data.entity;
    if (!entity?.isValid) {
      return;
    }
    entity.dimension.playSound(FUSE_SOUND_ID, entity.location);
  };

  onEntityHurtEntity = (data: EntityHurtAfterEvent): void => {
    const target = data.hurtEntity;
    if (!isAlive(target)) {
      return;
    }
    applyBombDamageBonus(target, data.damage, data.damageSource);
  };
}
