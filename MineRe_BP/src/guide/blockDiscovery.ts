import { GameMode, Player } from "@minecraft/server";
import {
  getGuideDiscoveryCategory,
  setGuideDiscoveryCategory,
} from "guide/discoveryStorage";

export const GUIDE_ORE_BLOCKS = [
  "amethyst_ore",
  "deepslate_amethyst_ore",
  "sulfur_ore",
  "deepslate_sulfur_ore",
  "basalt_iron_ore",
  "blackstone_iron_ore",
  "indigon_ore",
  "basalt_indigon_ore",
  "nether_coal_ore",
  "basalt_nether_coal_ore",
  "enderon_ore",
  "ender_plasma_ore",
] as const;

export const GUIDE_DISCOVERABLE_BLOCKS = ["ghost_pot"] as const;

type GuideOreBlockId = (typeof GUIDE_ORE_BLOCKS)[number];
type GuideDiscoverableBlockId = (typeof GUIDE_DISCOVERABLE_BLOCKS)[number];
type BlockDiscoveryData = Record<GuideOreBlockId, true>;

function getBlockDiscoveryData(player: Player): Partial<BlockDiscoveryData> {
  const entries = getGuideDiscoveryCategory(player, "ores");
  const discoveries: Partial<BlockDiscoveryData> = {};
  for (const blockId of GUIDE_ORE_BLOCKS) {
    if (entries[blockId] === true) {
      discoveries[blockId] = true;
    }
  }
  return discoveries;
}

export function discoverOre(player: Player, typeId: string): void {
  if (player.getGameMode() === GameMode.Creative) {
    return;
  }

  const blockId = typeId.replace("minere:", "") as GuideOreBlockId;
  if (!GUIDE_ORE_BLOCKS.includes(blockId)) {
    return;
  }

  const discoveries = getBlockDiscoveryData(player);
  if (discoveries[blockId]) {
    return;
  }

  discoveries[blockId] = true;
  setGuideDiscoveryCategory(player, "ores", discoveries);
}

export function getDiscoveredOres(player: Player): GuideOreBlockId[] {
  const discoveries = getBlockDiscoveryData(player);
  return GUIDE_ORE_BLOCKS.filter((blockId) => discoveries[blockId]);
}

export function getDiscoveredOreCount(player: Player): number {
  return getDiscoveredOres(player).length;
}

export function discoverBlock(player: Player, blockId: string): void {
  if (player.getGameMode() === GameMode.Creative) {
    return;
  }

  if (
    !GUIDE_DISCOVERABLE_BLOCKS.includes(blockId as GuideDiscoverableBlockId)
  ) {
    return;
  }

  const discoveries = getGuideDiscoveryCategory(player, "blocks");
  if (discoveries[blockId] === true) {
    return;
  }

  discoveries[blockId] = true;
  setGuideDiscoveryCategory(player, "blocks", discoveries);
}

export function hasDiscoveredBlock(player: Player, blockId: string): boolean {
  return getGuideDiscoveryCategory(player, "blocks")[blockId] === true;
}
