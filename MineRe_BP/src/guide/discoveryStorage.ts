import { Player, world } from "@minecraft/server";

export const GUIDE_DISCOVERY_PROPERTY = "minere:guide_discovery";

export type GuideDiscoveryCategory =
  | "animals"
  | "monsters"
  | "bosses"
  | "equipment"
  | "ores"
  | "blocks";

type DiscoveryEntries = Record<string, unknown>;
type PlayerGuideDiscovery = Record<GuideDiscoveryCategory, DiscoveryEntries>;
type GuideDiscoveryStore = Record<string, Partial<PlayerGuideDiscovery>>;

const discoveryCategories: GuideDiscoveryCategory[] = [
  "animals",
  "monsters",
  "bosses",
  "equipment",
  "ores",
  "blocks",
];

function getGuideDiscoveryStore(): GuideDiscoveryStore {
  const value = world.getDynamicProperty(GUIDE_DISCOVERY_PROPERTY);
  if (typeof value !== "string") {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const store: GuideDiscoveryStore = {};
    for (const [playerId, entry] of Object.entries(parsed)) {
      if (!entry || typeof entry !== "object") {
        continue;
      }

      const playerDiscovery: Partial<PlayerGuideDiscovery> = {};
      for (const category of discoveryCategories) {
        const entries = (entry as Record<string, unknown>)[category];
        if (entries && typeof entries === "object") {
          playerDiscovery[category] = entries as DiscoveryEntries;
        }
      }
      store[playerId] = playerDiscovery;
    }
    return store;
  } catch {
    return {};
  }
}

export function getGuideDiscoveryCategory(
  player: Player,
  category: GuideDiscoveryCategory,
): DiscoveryEntries {
  return { ...getGuideDiscoveryStore()[player.id]?.[category] };
}

export function setGuideDiscoveryCategory(
  player: Player,
  category: GuideDiscoveryCategory,
  entries: DiscoveryEntries,
): void {
  const store = getGuideDiscoveryStore();
  const playerDiscovery = store[player.id] ?? {};
  playerDiscovery[category] = entries;
  store[player.id] = playerDiscovery;
  world.setDynamicProperty(GUIDE_DISCOVERY_PROPERTY, JSON.stringify(store));
}

export function clearGuideDiscovery(player: Player): void {
  const store = getGuideDiscoveryStore();
  delete store[player.id];
  world.setDynamicProperty(GUIDE_DISCOVERY_PROPERTY, JSON.stringify(store));
}
