import {
  Dimension,
  EntityComponentTypes,
  EntityEquippableComponent,
  EquipmentSlot,
  ItemCustomComponent,
  Player,
  system,
  Vector3,
  world,
} from "@minecraft/server";
import { findValidLocation } from "functions/area/findValidLocation";

const MAX_SPAWN_ATTEMPTS = 30;
const MIN_SPAWN_DISTANCE = 8;
const MAX_SPAWN_DISTANCE = 24;
const EXISTING_BOSS_RADIUS = 32;

type BossTotemDefinition = {
  bossId: string;
  requiredLocationMessageKey: string;
  biomeTags?: string[];
  structureId?: string;
  footprintWidth: number;
  height: number;
  bossName: string;
  bossNameColor: string;
  immediateSoundId: string;
  particleId?: string;
  spawnSoundId?: string;
  requireNight?: boolean;
};

const bossTotems = new Map<string, BossTotemDefinition>();
bossTotems.set("minere:inferno_totem", {
  bossId: "minere:inferno",
  requiredLocationMessageKey: "message.minere:boss_totem.inferno_location",
  structureId: "minecraft:fortress",
  footprintWidth: 2,
  height: 4,
  bossName: "Inferno",
  bossNameColor: "§6",
  immediateSoundId: "mob.demon.magic",
  particleId: "minere:inferno_summon",
  spawnSoundId: "mob.ghast.fireball",
});
bossTotems.set("minere:glacier_totem", {
  bossId: "minere:glacier",
  requiredLocationMessageKey: "message.minere:boss_totem.glacier_location",
  biomeTags: ["frozen", "ocean"],
  footprintWidth: 3,
  height: 4,
  bossName: "Glacier",
  bossNameColor: "§b",
  immediateSoundId: "boss.glacier.ambient",
  requireNight: true,
});

const SPAWN_DELAY_TICKS = 20 * 2;

export const BossTotem: ItemCustomComponent = {
  onUse(arg) {
    if (!(arg.source instanceof Player)) {
      return;
    }

    const definition = bossTotems.get(arg.itemStack?.typeId);
    if (!definition || !isHeldInMainhand(arg.source, arg.itemStack?.typeId)) {
      return;
    }

    if (!isInRequiredLocation(arg.source.dimension, arg.source.location, definition)) {
      sendError(arg.source, definition.requiredLocationMessageKey, definition.bossName);
      return;
    }

    if (hasNearbyBoss(arg.source, definition)) {
      sendError(arg.source, "message.minere:boss_totem.boss_nearby", definition.bossName);
      return;
    }

    const spawnLocation = findSpawnLocation(arg.source, definition);
    if (!spawnLocation) {
      sendError(arg.source, "message.minere:boss_totem.no_spawn_location", definition.bossName);
      return;
    }

    const dimension = arg.source.dimension;
    const equippable = arg.source.getComponent(
      EntityComponentTypes.Equippable,
    ) as EntityEquippableComponent;
    equippable.setEquipment(EquipmentSlot.Mainhand, undefined);

    arg.source.sendMessage(
      `${definition.bossNameColor}${definition.bossName}§r has been summoned!`,
    );
    if (definition.particleId) {
      dimension.spawnParticle(definition.particleId, spawnLocation);
    }
    dimension.playSound(definition.immediateSoundId, spawnLocation);

    system.runTimeout(() => {
      try {
        const boss = dimension.spawnEntity<string>(
          definition.bossId,
          spawnLocation,
        );
        if (definition.spawnSoundId) {
          boss.dimension.playSound(definition.spawnSoundId, boss.location, {
            volume: 2.0,
            pitch: 0.3,
          });
        }
      } catch {
        // The totem is already consumed after a valid spawn location is found.
      }
    }, SPAWN_DELAY_TICKS);
  },
};

function sendError(player: Player, messageKey: string, bossName: string) {
  player.playSound("item.amethyst_staff.error");
  player.sendMessage({
    translate: messageKey,
    with: {
      rawtext: [
        {
          translate: bossName,
        },
      ],
    },
  });
}

function isHeldInMainhand(player: Player, itemId: string | undefined): boolean {
  const equippable = player.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;
  return equippable?.getEquipment(EquipmentSlot.Mainhand)?.typeId === itemId;
}

function isInRequiredLocation(
  dimension: Dimension,
  location: Vector3,
  definition: BossTotemDefinition,
): boolean {
  try {
    if (!!definition.structureId) {
      if (!dimension.getGeneratedStructures(location).includes(definition.structureId)) {
        return false;
      }
    }
    if (definition.biomeTags !== undefined) {
      if (!dimension.getBiome(location).hasTags(definition.biomeTags)) {
        return false;
      }
    }
    if (definition.requireNight) {
      const time = world.getTimeOfDay();
      if (time < 13000 || time > 23000) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

function hasNearbyBoss(
  player: Player,
  definition: BossTotemDefinition,
): boolean {
  return (
    player.dimension.getEntities({
      type: definition.bossId,
      location: player.location,
      maxDistance: EXISTING_BOSS_RADIUS,
    }).length > 0
  );
}

function findSpawnLocation(player: Player, definition: BossTotemDefinition) {
  return findValidLocation({
    dimension: player.dimension,
    origin: player.location,
    attempts: MAX_SPAWN_ATTEMPTS,
    minHorizontalDistance: MIN_SPAWN_DISTANCE,
    maxHorizontalDistance: MAX_SPAWN_DISTANCE,
    groundSearch: {
      maxOffset: 0,
    },
    clearance: {
      width: definition.footprintWidth,
      height: definition.height,
      requireGround: true,
    },
    isValidCandidate: (location) => {
      if (!isInRequiredLocation(player.dimension, location, definition)) {
        return false;
      }
      const horizontalDistance = Math.hypot(
        location.x - player.location.x,
        location.z - player.location.z,
      );
      return (
        horizontalDistance >= MIN_SPAWN_DISTANCE &&
        horizontalDistance <= MAX_SPAWN_DISTANCE
      );
    },
  });
}
