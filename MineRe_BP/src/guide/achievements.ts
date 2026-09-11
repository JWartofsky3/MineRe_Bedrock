import {
  Entity,
  EntityComponentTypes,
  EntityDamageSource,
  EntityProjectileComponent,
  Player,
  world,
} from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import {
  getGuideDiscoveryCategory,
  setGuideDiscoveryCategory,
} from "guide/discoveryStorage";
import {
  DISCOVERABLE_EQUIPMENT,
  getDiscoveredEquipmentCount,
} from "guide/equipmentDiscovery";

interface AchievementDefinition {
  id: string;
  title: string;
  objective: string;
  iconPath: string;
  experience: number;
  rewardItems: readonly { itemId: string; amount: number }[];
}

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  {
    id: "the_exchange",
    title: "guide.minere.achievement.interact_squirrel.title",
    objective: "guide.minere.achievement.interact_squirrel.objective",
    iconPath: "textures/items/minere/acorn",
    experience: 15,
    rewardItems: [],
  },
  {
    id: "black_market",
    title: "guide.minere.achievement.interact_goblin.title",
    objective: "guide.minere.achievement.interact_goblin.objective",
    iconPath: "textures/items/emerald",
    experience: 30,
    rewardItems: [],
  },
  {
    id: "powerful_ally",
    title: "guide.minere.achievement.tame_grizzly_bear.title",
    objective: "guide.minere.achievement.tame_grizzly_bear.objective",
    iconPath: "textures/items/fish_salmon_raw",
    experience: 50,
    rewardItems: [],
  },
  {
    id: "a_big_one",
    title: "guide.minere.achievement.tame_elephant.title",
    objective: "guide.minere.achievement.tame_elephant.objective",
    iconPath: "textures/items/apple",
    experience: 50,
    rewardItems: [],
  },
  {
    id: "primate_pal",
    title: "guide.minere.achievement.tame_monkey.title",
    objective: "guide.minere.achievement.tame_monkey.objective",
    iconPath: "textures/items/melon_speckled",
    experience: 30,
    rewardItems: [],
  },
  {
    id: "got_a_moose",
    title: "guide.minere.achievement.tame_moose.title",
    objective: "guide.minere.achievement.tame_moose.objective",
    iconPath: "textures/items/bone",
    experience: 30,
    rewardItems: [],
  },
  {
    id: "into_fire",
    title: "guide.minere.achievement.defeat_inferno.title",
    objective: "guide.minere.achievement.defeat_inferno.objective",
    iconPath: "textures/items/minere/inferno_crown",
    experience: 150,
    rewardItems: [],
  },
  {
    id: "frozen",
    title: "guide.minere.achievement.defeat_glacier.title",
    objective: "guide.minere.achievement.defeat_glacier.objective",
    iconPath: "textures/items/minere/ice_crown",
    experience: 150,
    rewardItems: [],
  },
  {
    id: "armored",
    title: "guide.minere.achievement.use_bear_armor.title",
    objective: "guide.minere.achievement.use_bear_armor.objective",
    iconPath: "textures/items/minere/bear_armor/copper_bear_armor",
    experience: 50,
    rewardItems: [],
  },
  {
    id: "lots_of_diamonds",
    title: "guide.minere.achievement.use_diamond_elephant_armor.title",
    objective: "guide.minere.achievement.use_diamond_elephant_armor.objective",
    iconPath: "textures/items/minere/elephant_armor/diamond",
    experience: 75,
    rewardItems: [],
  },
  {
    id: "staff_collector",
    title: "guide.minere.achievement.obtain_magic_staves.title",
    objective: "guide.minere.achievement.obtain_magic_staves.objective",
    iconPath: "textures/items/minere/emerald_staff",
    experience: 200,
    rewardItems: [],
  },
  {
    id: "sword_collector",
    title: "guide.minere.achievement.obtain_magic_swords.title",
    objective: "guide.minere.achievement.obtain_magic_swords.objective",
    iconPath: "textures/items/minere/firebrand",
    experience: 200,
    rewardItems: [],
  },
  {
    id: "tool_collector",
    title: "guide.minere.achievement.obtain_magic_tools.title",
    objective: "guide.minere.achievement.obtain_magic_tools.objective",
    iconPath: "textures/items/minere/wind_shovel",
    experience: 200,
    rewardItems: [],
  },
  {
    id: "build_indigon_golem",
    title: "guide.minere.achievement.build_indigon_golem.title",
    objective: "guide.minere.achievement.build_indigon_golem.objective",
    iconPath: "textures/blocks/minere/indigon_block",
    experience: 150,
    rewardItems: [],
  },
  {
    id: "discover_all_monsters",
    title: "guide.minere.achievement.discover_all_monsters.title",
    objective: "guide.minere.achievement.discover_all_monsters.objective",
    iconPath: "textures/items/diamond_sword",
    experience: 200,
    rewardItems: [],
  },
  {
    id: "discover_all_animals",
    title: "guide.minere.achievement.discover_all_animals.title",
    objective: "guide.minere.achievement.discover_all_animals.objective",
    iconPath: "textures/items/egg",
    experience: 200,
    rewardItems: [],
  },
  {
    id: "use_elephant_armor",
    title: "guide.minere.achievement.use_elephant_armor.title",
    objective: "guide.minere.achievement.use_elephant_armor.objective",
    iconPath: "textures/items/minere/elephant_armor/copper",
    experience: 100,
    rewardItems: [],
  },
  {
    id: "use_enderon_bear_armor",
    title: "guide.minere.achievement.use_enderon_bear_armor.title",
    objective: "guide.minere.achievement.use_enderon_bear_armor.objective",
    iconPath: "textures/items/minere/bear_armor/enderon_bear_armor",
    experience: 90,
    rewardItems: [],
  },
  {
    id: "defeat_demon",
    title: "guide.minere.achievement.defeat_demon.title",
    objective: "guide.minere.achievement.defeat_demon.objective",
    iconPath: "textures/items/iron_sword",
    experience: 75,
    rewardItems: [],
  },
  {
    id: "defeat_vampire",
    title: "guide.minere.achievement.defeat_vampire.title",
    objective: "guide.minere.achievement.defeat_vampire.objective",
    iconPath: "textures/items/redstone_dust",
    experience: 50,
    rewardItems: [],
  },
];

const achievementsById = new Map(
  ACHIEVEMENTS.map((achievement) => [achievement.id, achievement]),
);
const BEAR_ARMOR_IDS = new Set<string>([
  "minere:copper_bear_armor",
  "minere:iron_bear_armor",
  "minere:gold_bear_armor",
  "minere:diamond_bear_armor",
  "minere:netherite_bear_armor",
  "minere:enderon_bear_armor",
  "minere:indigon_bear_armor",
]);
const ELEPHANT_ARMOR_IDS = new Set<string>([
  "minere:copper_elephant_armor",
  "minere:iron_elephant_armor",
  "minere:gold_elephant_armor",
  "minere:diamond_elephant_armor",
  "minere:netherite_elephant_armor",
  "minere:enderon_elephant_armor",
  "minere:indigon_elephant_armor",
]);
const TAMING_ACHIEVEMENTS = new Map<string, string>([
  ["minere:grizzly_bear", "powerful_ally"],
  ["minere:elephant", "a_big_one"],
  ["minere:monkey", "primate_pal"],
  ["minere:moose", "got_a_moose"],
]);
const DEFEAT_ACHIEVEMENTS = new Map<string, string>([
  ["minere:inferno", "into_fire"],
  ["minere:glacier", "frozen"],
  ["minere:demon", "defeat_demon"],
  ["minere:vampire", "defeat_vampire"],
]);

type AchievementData = Record<string, true>;

function getAchievementData(player: Player): AchievementData {
  const entries = getGuideDiscoveryCategory(player, "achievements");
  const completed: AchievementData = {};
  for (const achievement of ACHIEVEMENTS) {
    if (entries[achievement.id] === true) {
      completed[achievement.id] = true;
    }
  }
  return completed;
}

export function getCompletedAchievementCount(player: Player): number {
  return Object.keys(getAchievementData(player)).length;
}

function hasCompletedAchievement(player: Player, achievementId: string): boolean {
  return getAchievementData(player)[achievementId] === true;
}

export function completeAchievement(player: Player, achievementId: string): void {
  const achievement = achievementsById.get(achievementId);
  if (!achievement || hasCompletedAchievement(player, achievementId)) {
    return;
  }

  const completed = getAchievementData(player);
  completed[achievementId] = true;
  setGuideDiscoveryCategory(player, "achievements", completed);
  player.addExperience(achievement.experience);
  player.playSound("random.levelup");
  world.sendMessage({
    rawtext: [
      { text: "[" },
      { text: "§e" },
      { text: player.name },
      { text: "§r] has obtained the achievement [" },
      { text: "§b" },
      { translate: achievement.title },
      { text: "§r]" },
    ],
  });
}

function showAchievementDetails(
  form: ActionFormData,
  achievement: AchievementDefinition,
): void {
  form.label({ translate: achievement.objective });
  form.label({
    translate: "guide.minere.achievement.reward.experience",
    with: [achievement.experience.toString()],
  });
}

export function showAchievementsPage(player: Player, onBack: () => void): void {
  const completed = getAchievementData(player);
  const incompleteAchievements = ACHIEVEMENTS.filter(
    (achievement) => !completed[achievement.id],
  );
  const completedAchievements = ACHIEVEMENTS.filter(
    (achievement) => completed[achievement.id],
  );
  const buttons = [...incompleteAchievements, ...completedAchievements];
  const form = new ActionFormData().title({
    translate: "guide.minere.achievement.title",
  });
  form.label({
    translate: "guide.minere.section.achievements.progress",
    with: [
      completedAchievements.length.toString(),
      ACHIEVEMENTS.length.toString(),
    ],
  });

  for (const achievement of incompleteAchievements) {
    form.button({ translate: achievement.title }, achievement.iconPath);
  }

  if (completedAchievements.length > 0) {
    form.header("§aCompleted");
    for (const achievement of completedAchievements) {
      form.button({ translate: achievement.title }, achievement.iconPath);
    }
  }

  form.button({ translate: "guide.minere.back" });
  form
    .show(player)
    .then((response) => {
      if (response.canceled || response.selection === undefined) {
        return;
      }
      if (response.selection === buttons.length) {
        onBack();
        return;
      }
      showAchievementDetailsPage(
        player,
        buttons[response.selection].id,
        () => showAchievementsPage(player, onBack),
      );
    })
    .catch((error) =>
      console.error("Failed to show achievements page: " + error),
    );
}

function showAchievementDetailsPage(
  player: Player,
  achievementId: string,
  onBack: () => void,
): void {
  const achievement = achievementsById.get(achievementId);
  if (!achievement) {
    onBack();
    return;
  }

  const form = new ActionFormData().title({ translate: achievement.title });
  showAchievementDetails(form, achievement);
  form.button({ translate: "guide.minere.back" });
  form
    .show(player)
    .then((response) => {
      if (!response.canceled) {
        onBack();
      }
    })
    .catch((error) =>
      console.error("Failed to show achievement details: " + error),
    );
}

function isValidEntity(entity: Entity | undefined): entity is Entity {
  return entity?.isValid ?? false;
}

function getResponsiblePlayer(source: EntityDamageSource): Player | undefined {
  const damagingEntity = source.damagingEntity;
  if (isValidEntity(damagingEntity) && damagingEntity.typeId === "minecraft:player") {
    return damagingEntity as Player;
  }

  const projectile = source.damagingProjectile ?? damagingEntity;
  if (!isValidEntity(projectile)) {
    return undefined;
  }

  const projectileComponent = projectile.getComponent(
    EntityComponentTypes.Projectile,
  ) as EntityProjectileComponent | undefined;
  const owner = projectileComponent?.owner;
  if (isValidEntity(owner) && owner.typeId === "minecraft:player") {
    return owner as Player;
  }
  return undefined;
}

function wasItemConsumed(
  beforeItemStack: { typeId: string; amount: number } | undefined,
  itemStack: { typeId: string; amount: number } | undefined,
  itemId: string,
): boolean {
  if (beforeItemStack?.typeId !== itemId) {
    return false;
  }
  return itemStack?.typeId !== itemId || itemStack.amount < beforeItemStack.amount;
}

function completeArmorAchievements(player: Player, itemId: string): void {
  if (BEAR_ARMOR_IDS.has(itemId)) {
    completeAchievement(player, "armored");
  }
  if (itemId === "minere:diamond_elephant_armor") {
    completeAchievement(player, "lots_of_diamonds");
  }
}

function completeAppliedArmorAchievements(
  player: Player,
  targetTypeId: string,
  itemId: string,
): void {
  if (
    targetTypeId === "minere:elephant" &&
    ELEPHANT_ARMOR_IDS.has(itemId)
  ) {
    completeAchievement(player, "use_elephant_armor");
  }
  if (
    targetTypeId === "minere:grizzly_bear" &&
    itemId === "minere:enderon_bear_armor"
  ) {
    completeAchievement(player, "use_enderon_bear_armor");
  }
}

function completeEquipmentCollectionAchievements(player: Player): void {
  if (
    getDiscoveredEquipmentCount(
      player,
      DISCOVERABLE_EQUIPMENT.magicStaves,
    ) === DISCOVERABLE_EQUIPMENT.magicStaves.length
  ) {
    completeAchievement(player, "staff_collector");
  }
  if (
    getDiscoveredEquipmentCount(
      player,
      DISCOVERABLE_EQUIPMENT.magicSwords,
    ) === DISCOVERABLE_EQUIPMENT.magicSwords.length
  ) {
    completeAchievement(player, "sword_collector");
  }
  if (
    getDiscoveredEquipmentCount(
      player,
      DISCOVERABLE_EQUIPMENT.magicTools,
    ) === DISCOVERABLE_EQUIPMENT.magicTools.length
  ) {
    completeAchievement(player, "tool_collector");
  }
}

export function initializeGuideAchievements(): void {
  world.afterEvents.playerInteractWithEntity.subscribe((event) => {
    const { player, target, beforeItemStack, itemStack } = event;
    if (
      target.typeId === "minere:squirrel" &&
      wasItemConsumed(beforeItemStack, itemStack, "minere:acorn")
    ) {
      completeAchievement(player, "the_exchange");
    }
    if (
      target.typeId === "minere:goblin" &&
      wasItemConsumed(beforeItemStack, itemStack, "minecraft:emerald")
    ) {
      completeAchievement(player, "black_market");
    }

    if (
      (target.typeId === "minere:grizzly_bear" ||
        target.typeId === "minere:elephant") &&
      (beforeItemStack || itemStack)
    ) {
      const appliedItemId = (beforeItemStack ?? itemStack)?.typeId ?? "";
      completeArmorAchievements(player, appliedItemId);
      completeAppliedArmorAchievements(player, target.typeId, appliedItemId);
    }
  });

  world.afterEvents.entityTamed.subscribe((event) => {
    const achievementId = TAMING_ACHIEVEMENTS.get(event.entity.typeId);
    if (
      achievementId &&
      event.tamingEntity.typeId === "minecraft:player"
    ) {
      completeAchievement(event.tamingEntity as Player, achievementId);
    }
  });

  world.afterEvents.playerInventoryItemChange.subscribe((event) => {
    if (event.itemStack) {
      completeArmorAchievements(event.player, event.itemStack.typeId);
      completeEquipmentCollectionAchievements(event.player);
    }
  });

  world.afterEvents.entityDie.subscribe((event) => {
    const achievementId = DEFEAT_ACHIEVEMENTS.get(event.deadEntity.typeId);
    if (!achievementId || !event.damageSource) {
      return;
    }
    const player = getResponsiblePlayer(event.damageSource);
    if (player) {
      completeAchievement(player, achievementId);
    }
  });
}
