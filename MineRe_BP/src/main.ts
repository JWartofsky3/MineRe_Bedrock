import { world, system, Player, StartupEvent } from "@minecraft/server";

// ───────────────────────── Imports: Registry / Settings ─────────────────────────
import { registerBlocks } from "registry/blockRegistry";
import { registerItems } from "registry/itemRegistry";
import { registerCustomEntities } from "registry/customEntityRegistry";
import {
  ARMOR_WEIGHT,
  giveOutSettingsBook,
  initializeWorldSettings,
} from "settings";

// ───────────────────────── Imports: Player ─────────────────────────
import { healFromItem } from "player/healFromItem";
import { playerHungerHeal } from "player/playerHungerHeal";
import { armorWeight } from "player/armorWeight";

// ───────────────────────── Imports: Items ─────────────────────────
import { useAmethystStaff } from "item/amethyst_staff";
import { useEchoStaff } from "item/echo_staff";
import { useFireStaff } from "item/fire_staff";
import { useBlasterStaff } from "item/blaster_staff";
import { fireInfintyBowAfter } from "item/infinity_bow";
import { offHandTreecapitate } from "item/treecapitator";
import { onAxeUse, onShovelUse, onHoeUse } from "item/custom_tools";

// ───────────────────────── Imports: Blocks ─────────────────────────
import { blockDropItem } from "block/blockDropItem";

// ───────────────────────── Imports: Mobs / AI ─────────────────────────
import { skeletonStrafe } from "mob/skeleton_strafe";
import { matchParent } from "events/spawning/babySpawnMatchParent";

// ───────────────────────── Imports: World / Weather ─────────────────────────
import { runEndStorms } from "weather/end_storm";
import { useEmeraldStaff } from "item/emerald_staff";
import { RegisterCustomEvents } from "registry/eventRegistry";

// ───────────────────────── Constants ─────────────────────────
export const DEFAULT_TICK = 20;

// ───────────────────────── Startup ─────────────────────────
system.beforeEvents.startup.subscribe((data: StartupEvent) => {
  registerItems(data);
  registerBlocks(data);
  registerCustomEntities();
  RegisterCustomEvents();
  initializeWorldSettings();
});

giveOutSettingsBook();

// ───────────────────────── Item Events ─────────────────────────
world.afterEvents.itemReleaseUse.subscribe(fireInfintyBowAfter);
world.afterEvents.itemCompleteUse.subscribe(healFromItem);

world.beforeEvents.itemUse.subscribe((data) => {
  useAmethystStaff(data);
  useEchoStaff(data);
  useFireStaff(data);
  useBlasterStaff(data);
  useEmeraldStaff(data);
});

// ───────────────────────── Player Events ─────────────────────────
world.afterEvents.entityHealthChanged.subscribe(playerHungerHeal);

world.afterEvents.playerBreakBlock.subscribe((data) => {
  offHandTreecapitate(data);
  blockDropItem(data);
});

world.afterEvents.playerInteractWithBlock.subscribe((data) => {
  onHoeUse(data.player, data.itemStack, data.block);
  onShovelUse(data.player, data.itemStack, data.block);
  onAxeUse(data.player, data.itemStack, data.block);
});

// ───────────────────────── Entity Lifecycle ─────────────────────────

world.afterEvents.entitySpawn.subscribe((data) => {
  const entity = data.entity;
  if (!entity?.isValid) return;

  if (entity.typeId === "minecraft:arrow") {
    skeletonStrafe(entity, 0.5);
  }
  matchParent(entity);
});

// ───────────────────────── Ticking Systems ─────────────────────────
system.runInterval(() => {
  if (!world.getDynamicProperty(ARMOR_WEIGHT)?.valueOf()) return;
  world.getAllPlayers().forEach(armorWeight);
}, 1);

runEndStorms();
