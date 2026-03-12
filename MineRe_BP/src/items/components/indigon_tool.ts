import {
  ItemComponentHitEntityEvent,
  ItemComponentMineBlockEvent,
  ItemCustomComponent,
  ItemComponentTypes,
  ItemDurabilityComponent,
  Player,
  system,
  ItemStack,
} from "@minecraft/server";

const INDIGON_TOOL_SOUND_ID = "item.armor.powerup";
const INDIGON_TOOL_SOUND_VOLUME = 0.8;
const INDIGON_TOOL_MESSAGE = "info.minere:indigon_tool.activate";
const INDIGON_TOOL_STRENGTH_MESSAGE = "info.minere:indigon_tool.attack";
const INDIGON_TOOL_COOLDOWN_PROPERTY = "minere:indigon_tool_cooldown";
const INDIGON_TOOL_COOLDOWN_TICKS = 20 * 5;
const STRENGTH_DURATION_TICKS = 20 * 7;
const STRENGTH_AMPLIFIER = 1;
const HASTE_DURATION_TICKS = 20 * 7;
const HASTE_AMPLIFIER = 1;
const MIN_TRIGGER_CHANCE = 0.05;
const MAX_TRIGGER_CHANCE = 0.5;

export const IndigonTool: ItemCustomComponent = {
  onHitEntity(event: ItemComponentHitEntityEvent) {
    const player = event.attackingEntity;
    if (!(player instanceof Player)) {
      return;
    }

    if (isPlayerOnCooldown(player)) {
      return;
    }

    const durability = event.itemStack?.getComponent(
      ItemComponentTypes.Durability,
    ) as ItemDurabilityComponent;
    if (!durability) {
      return;
    }

    const durabilityRatio = getDurabilityRatio(durability);
    if (durabilityRatio > 0.5) {
      return;
    }

    const chance = getTriggerChance(durabilityRatio);
    if (Math.random() > chance) {
      return;
    }

    player.setDynamicProperty(
      INDIGON_TOOL_COOLDOWN_PROPERTY,
      system.currentTick,
    );
    player.addEffect("strength", STRENGTH_DURATION_TICKS, {
      amplifier: STRENGTH_AMPLIFIER,
      showParticles: false,
    });
    player.dimension.playSound(INDIGON_TOOL_SOUND_ID, player.location, {
      volume: INDIGON_TOOL_SOUND_VOLUME,
    });
    player.sendMessage({
      translate: INDIGON_TOOL_STRENGTH_MESSAGE,
    });
  },
  onMineBlock(event: ItemComponentMineBlockEvent) {
    const player = event.source;
    if (!(player instanceof Player)) {
      return;
    }

    if (isPlayerOnCooldown(player)) {
      return;
    }

    const durability = event.itemStack?.getComponent(
      ItemComponentTypes.Durability,
    ) as ItemDurabilityComponent;
    if (!durability) {
      return;
    }

    const durabilityRatio = getDurabilityRatio(durability);
    if (durabilityRatio > 0.5) {
      return;
    }

    const chance = getTriggerChance(durabilityRatio);
    if (Math.random() > chance) {
      return;
    }

    player.setDynamicProperty(
      INDIGON_TOOL_COOLDOWN_PROPERTY,
      system.currentTick,
    );
    player.addEffect("haste", HASTE_DURATION_TICKS, {
      amplifier: HASTE_AMPLIFIER,
      showParticles: false,
    });
    player.dimension.playSound(INDIGON_TOOL_SOUND_ID, player.location, {
      volume: INDIGON_TOOL_SOUND_VOLUME,
    });
    player.sendMessage({
      translate: INDIGON_TOOL_MESSAGE,
    });
  },
};

function isPlayerOnCooldown(player: Player): boolean {
  const cooldown = player.getDynamicProperty(INDIGON_TOOL_COOLDOWN_PROPERTY);
  return (
    typeof cooldown === "number" &&
    system.currentTick - cooldown < INDIGON_TOOL_COOLDOWN_TICKS
  );
}

function getDurabilityRatio(durability: ItemDurabilityComponent): number {
  const remaining = Math.max(0, durability.maxDurability - durability.damage);
  return remaining / durability.maxDurability;
}

function getTriggerChance(durabilityRatio: number): number {
  const missingHalfProgress = Math.min(
    1,
    Math.max(0, (0.5 - durabilityRatio) / 0.5),
  );
  return (
    MIN_TRIGGER_CHANCE +
    (MAX_TRIGGER_CHANCE - MIN_TRIGGER_CHANCE) * missingHalfProgress
  );
}
