import { EntityHurtAfterEvent, Entity, system } from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { webLine } from "functions/webLine";
import { distVector3 } from "util/vector3Functions";
import { DEFAULT_TICK } from "main";
import { isAlive } from "mob/mob_utils";

const WEB_COOLDOWN_KEY = "minere:web_cooldown";
const ACTIVATION_RANGE = 5;
const MAX_RANGE = 6;
const COOLDOWN_TIME = 8;
const SOUND_ID = "mob.web_spider.shoot";

export class WebSpider extends BaseCustomEntity {
  constructor() {
    super("minere:web_spider");
  }

  onEntityHurtEntity = (data: EntityHurtAfterEvent): void => {
    const attacker = data.damageSource?.damagingEntity;
    const target = data.hurtEntity;
    if (!isAlive(attacker) || !isAlive(target)) {
      return;
    }
    this.tryWebAttack(attacker, target, 0.6);
  };

  onEntityHurt = (data: EntityHurtAfterEvent): void => {
    const target = data.hurtEntity;
    const attacker = data.damageSource?.damagingEntity;
    if (!isAlive(target) || !isAlive(attacker)) {
      return;
    }
    this.tryWebAttack(target, attacker, 0.4);
  };

  private tryWebAttack(spider: Entity, target: Entity, chance: number): void {
    if (Math.random() > chance) {
      return;
    }
    if (distVector3(spider.location, target.location) > ACTIVATION_RANGE) {
      return;
    }
    const cooldown = spider.getDynamicProperty(WEB_COOLDOWN_KEY);
    if (
      !!cooldown &&
      typeof cooldown == "number" &&
      system.currentTick - cooldown < COOLDOWN_TIME * DEFAULT_TICK
    ) {
      return;
    }
    spider.setDynamicProperty(WEB_COOLDOWN_KEY, system.currentTick);
    spider.dimension.playSound(SOUND_ID, spider.location);
    webLine(spider.dimension, spider.location, target.location, {
      maxRange: MAX_RANGE,
    });
  }
}
