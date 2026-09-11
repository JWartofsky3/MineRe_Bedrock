import {
  Entity,
  EntityComponentTypes,
  EntityHealthComponent,
  world,
} from "@minecraft/server";
import { RegisterableEvent } from "events/CustomEvent";
import { getMainItem } from "items/components/item_utils";
import { isFamily } from "mob/mob_utils";
import { GOLD_XP_BONUS } from "settings";
import {
  hasAnyIdentifierKeyword,
  hasIdentifierKeywords,
} from "util/identifierKeywords";
import { addVector3, randomVector3 } from "util/vector3Functions";

const GOLD = 0.5;
const COPPER = 0.1;
const DAMAGE_DEALING_ITEM_KEYWORDS = [
  // Vanilla weapons and tools.
  "sword",
  "pickaxe",
  "axe",
  "shovel",
  "hoe",
  "trident",
  "mace",
  "bow",
  "crossbow",
  // MineRe and common weapon names.
  "spear",
  "dagger",
  "knife",
  "scythe",
  "battleaxe",
  "hammer",
  "warhammer",
  "club",
  "halberd",
  "glaive",
  "pike",
  "lance",
  "rapier",
  "treecapitator",
];

const XP_VERTICAL_VELOCITY = 0.02;
const XP_VELOCITY = 0.02;
const itemXPMap = new Map<string, number>();

// COPPER
itemXPMap.set("minecraft:copper_sword", COPPER);
itemXPMap.set("minecraft:copper_pickaxe", COPPER);
itemXPMap.set("minecraft:copper_axe", COPPER);
itemXPMap.set("minecraft:copper_shovel", COPPER);
itemXPMap.set("minecraft:copper_hoe", COPPER);
itemXPMap.set("minere:copper_treecapitator", COPPER);

const xpMultiplierMap = new Map<string, number>();
xpMultiplierMap.set("minecraft:ghast", 2.5);
xpMultiplierMap.set("minere:cosmic_jelly", 2.5);

const MAX_BONUS = 100;

export class BonusXPEvent implements RegisterableEvent {
  register(): void {
    world.afterEvents.entityDie.subscribe((data) => {
      giveExtraXP(data.damageSource?.damagingEntity, data.deadEntity);
    });
  }
}

function giveExtraXP(source: Entity, entity: Entity) {
  if (!source || !source?.isValid || !entity || !entity?.isValid) {
    return;
  }
  if (source?.typeId !== "minecraft:player") {
    return;
  }
  if (!world?.getDynamicProperty(GOLD_XP_BONUS)?.valueOf()) {
    return;
  }
  const tool = getMainItem(source, { requireDurability: true });
  if (!tool) {
    return;
  }
  if (!isFamily(entity, "monster")) {
    return;
  }
  const health = entity.getComponent(
    EntityComponentTypes.Health,
  ) as EntityHealthComponent;
  if (!health) {
    return;
  }
  const itemXPFactor = getToolXPFactor(tool.typeId);
  if (!itemXPFactor) {
    return;
  }
  const dimension = entity.dimension;
  const location = entity.location;
  const xpMultiplier = xpMultiplierMap.get(entity.typeId) ?? 1.0;
  const xp = Math.min(
    MAX_BONUS,
    Math.floor(health.effectiveMax * itemXPFactor * xpMultiplier),
  );
  for (let i = 0; i < xp; i++) {
    const orb = dimension.spawnEntity("minecraft:xp_orb", location);
    orb.applyImpulse(
      addVector3(randomVector3(XP_VELOCITY), {
        x: 0,
        y: XP_VERTICAL_VELOCITY,
        z: 0,
      }),
    );
  }
}

function getToolXPFactor(typeId: string): number | undefined {
  if (isDamageDealingGoldenItem(typeId)) {
    return GOLD;
  }

  return itemXPMap.get(typeId);
}

function isDamageDealingGoldenItem(typeId: string): boolean {
  return (
    hasIdentifierKeywords(typeId, ["golden"]) &&
    hasAnyIdentifierKeyword(typeId, DAMAGE_DEALING_ITEM_KEYWORDS)
  );
}
