import {
  system,
  world,
  PlayerPermissionLevel,
  CommandPermissionLevel,
} from "@minecraft/server";
export const REDUCED_HEALTH_REGEN = "minere:reducedHealthRegen";
export const HEALING_FROM_SOUP = "minere:healingFromSoup";
export const ARMOR_WEIGHT = "minere:armorWeight";
export const ARMOR_CURVE = "minere:armorCurve";
export const PROTECTION_NERF = "minere:protectionNerf";
export const END_STORMS = "minere:endStorms";
export const HAS_GIVEN_BOOK = "minere:hasGivenBook";
// Function to get the current settings from dynamic properties.
export function getSettings() {
  return {
    reducedHealthRegen: world.getDynamicProperty(REDUCED_HEALTH_REGEN),
    healingFromSoup: world.getDynamicProperty(HEALING_FROM_SOUP),
    armorWeight: world.getDynamicProperty(ARMOR_WEIGHT),
    armorCurve: world.getDynamicProperty(ARMOR_CURVE),
    protectionNerf: world.getDynamicProperty(PROTECTION_NERF),
    endStorms: world.getDynamicProperty(END_STORMS),
  };
}
// Function to save the settings to dynamic properties.
export function saveSettings(settings) {
  world.setDynamicProperty(REDUCED_HEALTH_REGEN, settings.reducedHealthRegen);
  world.setDynamicProperty(HEALING_FROM_SOUP, settings.healingFromSoup);
  world.setDynamicProperty(ARMOR_WEIGHT, settings.armorWeight);
  world.setDynamicProperty(ARMOR_CURVE, settings.armorCurve);
  world.setDynamicProperty(PROTECTION_NERF, settings.protectionNerf);
  world.setDynamicProperty(END_STORMS, settings.endStorms);
}
/**
 * Initializes world dynamic properties with default values if they are not already present.
 */
export function initializeWorldSettings() {
  system.runTimeout(() => {
    // Check and set default for the book flag
    if (world.getDynamicProperty(HAS_GIVEN_BOOK) === undefined) {
      world.setDynamicProperty(HAS_GIVEN_BOOK, false);
    }
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
  });
}
// Gives out the settings book to the first operator/admin player in the world
export function giveOutSettingsBook() {
  // try giving the book when players join
  world.afterEvents.playerJoin.subscribe(function (data) {
    system.runTimeout(() => {
      let gaveOutBook = !!world?.getDynamicProperty(HAS_GIVEN_BOOK)?.valueOf();
      if (gaveOutBook) {
        return;
      }
      // check every tick for the loaded admin to join
      const runner = system.runInterval(() => {
        const players = world.getPlayers();
        for (let i = 0; i < players.length; i++) {
          if (players[i].id === data.playerId) {
            if (
              world.getDay() == 0 ||
              players[i].commandPermissionLevel ===
                CommandPermissionLevel.Admin ||
              players[i].playerPermissionLevel ===
                PlayerPermissionLevel.Operator
            ) {
              players[i].runCommand("give @s minere:settings_book");
              world.setDynamicProperty(HAS_GIVEN_BOOK, true);
              gaveOutBook = true;
              system.clearRun(runner);
            }
          }
        }
      });
      // stop checking after 10 seconds
      system.runTimeout(() => {
        system.clearRun(runner);
      }, 200);
    }, 20);
  });
}
