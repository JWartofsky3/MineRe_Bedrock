import {
  ItemComponentTypes,
  EntityComponentTypes,
  EquipmentSlot,
} from "@minecraft/server";
import { reduceDurability } from "./reduce_durability";
import { consumeXp } from "player/consumeXp";
import { isFamilySet } from "mob/mob_utils";
const DURABILITY_COST = 4;
const SHADOW_TIME_MIN = 5;
const SHADOW_TIME_MAX = 20;
const JUMP_BOOST_MIN = 1;
const JUMP_BOOST_MAX = 7;
const MAX_LEVEL = 50;
const SHADOW_XP_COST = 3;
const PWNS_TAG = "minere:pwns";
const DEFEATED_TAG = "minere:defeated_by_ghostwalker";
const levelUpFamilies = new Set();
levelUpFamilies.add("player");
levelUpFamilies.add("monster");
levelUpFamilies.add("irongolem");
export const Ghostwalker = {
  onHitEntity(arg) {
    if (
      !arg.attackingEntity?.isValid ||
      !arg.hitEntity?.isValid ||
      !arg.itemStack
    ) {
      return;
    }
    const health = arg.hitEntity.getComponent(EntityComponentTypes.Health);
    if (!health.isValid) {
      return;
    }
    if (health.currentValue > 0) {
      return;
    }
    if (arg.hitEntity?.getDynamicProperty(DEFEATED_TAG)?.valueOf) {
      return;
    }
    arg.hitEntity.setDynamicProperty(DEFEATED_TAG, true);
    if (!isFamilySet(arg.hitEntity, levelUpFamilies)) {
      return;
    }
    const pwns = (arg.itemStack.getDynamicProperty(PWNS_TAG) ?? 0) + 1;
    arg.itemStack.setDynamicProperty(PWNS_TAG, pwns);
    const lore =
      pwns < MAX_LEVEL
        ? `§c☠♠⚔ §c(${pwns}) §c⚔♠☠`
        : `§c☠♠⚔ §6(${pwns}) §c⚔♠☠`;
    arg.itemStack.setLore([lore]);
    const equippable = arg.attackingEntity.getComponent(
      EntityComponentTypes.Equippable,
    );
    equippable.setEquipment(EquipmentSlot.Mainhand, arg.itemStack);
  },
  onUse(arg) {
    if (!arg.source) return;
    const level = arg.itemStack?.getDynamicProperty(PWNS_TAG) ?? 0;
    const shadowTime = getShadowTime(level);
    const cooldownComponent = arg.itemStack?.getComponent(
      ItemComponentTypes.Cooldown,
    );
    if (cooldownComponent) {
      cooldownComponent.startCooldown(arg.source);
    }
    const dimension = arg.source.dimension;
    // consume XP
    if (!consumeXp(arg.source, SHADOW_XP_COST)) {
      arg.source.playSound("item.amethyst_staff.error");
      return;
    }
    // reduce durability
    reduceDurability(arg.source, arg.itemStack, DURABILITY_COST);
    // play shadow activation sound
    dimension.playSound("item.ghostwalker.ghost", arg.source.location);
    // apply self effects
    arg.source.addEffect("invisibility", shadowTime, { showParticles: false });
    arg.source.addEffect("jump_boost", shadowTime, {
      showParticles: false,
      amplifier: getJumpBoost(level),
    });
    arg.source.addEffect("slow_falling", shadowTime, { showParticles: false });
  },
};
function getShadowTime(level) {
  // Clamp the level between 0 and MAX_LEVEL
  level = Math.max(0, Math.min(level, MAX_LEVEL));
  // Linear interpolation
  const shadowTime =
    SHADOW_TIME_MIN + (SHADOW_TIME_MAX - SHADOW_TIME_MIN) * (level / MAX_LEVEL);
  return shadowTime * 20;
}
function getJumpBoost(level) {
  // Clamp the level between 0 and MAX_LEVEL
  level = Math.max(0, Math.min(level, MAX_LEVEL));
  // Linear interpolation, rounded down
  const jumpBoost =
    JUMP_BOOST_MIN + (JUMP_BOOST_MAX - JUMP_BOOST_MIN) * (level / MAX_LEVEL);
  return Math.floor(jumpBoost);
}
