import { system, world, Player } from "@minecraft/server";

export interface WorldSettings {
  reducedHealthRegen: boolean;
  healingFromSoup: boolean;
  armorWeight: boolean;
  armorCurve: boolean;
  protectionNerf: boolean;
  endStorms: boolean;
  gremlinBreaksTorches: boolean;
  ogreBreaksBlocks: boolean;
  reduceDaylightDrowned: boolean;
  goldXPBonus: boolean;
}

export const REDUCED_HEALTH_REGEN = "minere:reducedHealthRegen";
export const HEALING_FROM_SOUP = "minere:healingFromSoup";
export const ARMOR_WEIGHT = "minere:armorWeight";
export const ARMOR_CURVE = "minere:armorCurve";
export const PROTECTION_NERF = "minere:protectionNerf";
export const END_STORMS = "minere:endStorms";
export const GREMLIN_BREAKS_TORCHES = "minere:gremlinBreaksTorches";
export const OGRE_BREAKS_BLOCKS = "minere:ogreBreaksBlocks";
export const REDUCE_DAYLIGHT_DROWNED = "minere:reduceDaylightDrowned";
export const GOLD_XP_BONUS = "minere:goldXPBonus";
const HAS_RECEIVED_GUIDE = "minere:hasReceivedGuide";

// Function to get the current settings from dynamic properties.
export function getSettings(): WorldSettings {
  return {
    reducedHealthRegen: world.getDynamicProperty(
      REDUCED_HEALTH_REGEN,
    ) as boolean,
    healingFromSoup: world.getDynamicProperty(HEALING_FROM_SOUP) as boolean,
    armorWeight: world.getDynamicProperty(ARMOR_WEIGHT) as boolean,
    armorCurve: world.getDynamicProperty(ARMOR_CURVE) as boolean,
    protectionNerf: world.getDynamicProperty(PROTECTION_NERF) as boolean,
    endStorms: world.getDynamicProperty(END_STORMS) as boolean,
    gremlinBreaksTorches: world.getDynamicProperty(
      GREMLIN_BREAKS_TORCHES,
    ) as boolean,
    ogreBreaksBlocks: world.getDynamicProperty(OGRE_BREAKS_BLOCKS) as boolean,
    reduceDaylightDrowned: world.getDynamicProperty(
      REDUCE_DAYLIGHT_DROWNED,
    ) as boolean,
    goldXPBonus: world.getDynamicProperty(GOLD_XP_BONUS) as boolean,
  };
}

// Function to save the settings to dynamic properties.
export function saveSettings(settings: WorldSettings) {
  world.setDynamicProperty(REDUCED_HEALTH_REGEN, settings.reducedHealthRegen);
  world.setDynamicProperty(HEALING_FROM_SOUP, settings.healingFromSoup);
  world.setDynamicProperty(ARMOR_WEIGHT, settings.armorWeight);
  world.setDynamicProperty(ARMOR_CURVE, settings.armorCurve);
  world.setDynamicProperty(PROTECTION_NERF, settings.protectionNerf);
  world.setDynamicProperty(END_STORMS, settings.endStorms);
  world.setDynamicProperty(
    GREMLIN_BREAKS_TORCHES,
    settings.gremlinBreaksTorches,
  );
  world.setDynamicProperty(OGRE_BREAKS_BLOCKS, settings.ogreBreaksBlocks);
  world.setDynamicProperty(
    REDUCE_DAYLIGHT_DROWNED,
    settings.reduceDaylightDrowned,
  );
  world.setDynamicProperty(GOLD_XP_BONUS, settings.goldXPBonus);
}

/**
 * Initializes world dynamic properties with default values if they are not already present.
 */
export function initializeWorldSettings(): void {
  system.runTimeout(() => {
    // Check and set default for Reduced Health Regeneration
    if (world.getDynamicProperty(REDUCED_HEALTH_REGEN) === undefined) {
      world.setDynamicProperty(REDUCED_HEALTH_REGEN, true);
    }

    // Check and set default for Healing from Soup, etc.
    if (world.getDynamicProperty(HEALING_FROM_SOUP) === undefined) {
      world.setDynamicProperty(HEALING_FROM_SOUP, true);
    }

    // Check and set default for Armor Weight
    if (world.getDynamicProperty(ARMOR_WEIGHT) === undefined) {
      world.setDynamicProperty(ARMOR_WEIGHT, true);
    }

    // Check and set default for Armor Curve
    if (world.getDynamicProperty(ARMOR_CURVE) === undefined) {
      world.setDynamicProperty(ARMOR_CURVE, true);
    }

    // Check and set default for Protection Nerf
    if (world.getDynamicProperty(PROTECTION_NERF) === undefined) {
      world.setDynamicProperty(PROTECTION_NERF, true);
    }

    // Check and set default for End Storms
    if (world.getDynamicProperty(END_STORMS) === undefined) {
      world.setDynamicProperty(END_STORMS, true);
    }

    // Check and set default for Gremlin Breaks Torches
    if (world.getDynamicProperty(GREMLIN_BREAKS_TORCHES) === undefined) {
      world.setDynamicProperty(GREMLIN_BREAKS_TORCHES, true);
    }

    // Check and set default for Ogre Breaks Blocks
    if (world.getDynamicProperty(OGRE_BREAKS_BLOCKS) === undefined) {
      world.setDynamicProperty(OGRE_BREAKS_BLOCKS, true);
    }

    // Check and set default for Reduce Daylight Drowned
    if (world.getDynamicProperty(REDUCE_DAYLIGHT_DROWNED) === undefined) {
      world.setDynamicProperty(REDUCE_DAYLIGHT_DROWNED, true);
    }

    // Check and set default for Gold XP Bonus
    if (world.getDynamicProperty(GOLD_XP_BONUS) === undefined) {
      world.setDynamicProperty(GOLD_XP_BONUS, true);
    }
  });
}

/** Gives each player one Guide when their character is loaded for the first time. */
export function giveGuideOnPlayerLoad(): void {
  world.afterEvents.entityLoad.subscribe((data) => {
    if (data.entity.typeId !== "minecraft:player") {
      return;
    }

    const player = data.entity as Player;
    if (player.getDynamicProperty(HAS_RECEIVED_GUIDE)) {
      return;
    }

    try {
      player.runCommand("give @s minere:guide");
      player.setDynamicProperty(HAS_RECEIVED_GUIDE, true);
    } catch (error) {
      console.error("Failed to give Guide to player: " + error);
    }
  });
}
