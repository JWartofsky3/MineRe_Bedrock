import {
  Entity,
  EntityComponentTypes,
  EntityEquippableComponent,
  EquipmentSlot,
  GameMode,
  ItemComponentTypes,
  ItemCooldownComponent,
  EntityRidingComponent,
  ItemCustomComponent,
} from "@minecraft/server";
import { enderTeleport } from "entities/functions/enderTeleport";
import { particleWave } from "particles/particleWave";
import {
  addVector3,
  distVector3,
  multiplyVector3Number,
} from "util/vector3Functions";
import { getTeleporterMaxDistance } from "settings";
import {
  hasAnyIdentifierKeyword,
  hasIdentifierKeywords,
} from "util/identifierKeywords";

const ENDERON = "enderon";
const ENDERON_BLOCK = "minere:enderon_block";
const MULTIPLIER = 1.5;
const MIN_GROUND_LOOK_DISTANCE = 8;
const MAX_GROUND_LOOK_DISTANCE = 16;
const GROUND_LOOK_DISTANCE_SCALE = 0.5;
const CONSUME_CHANCE = 0.5;
const TELEPORT_PARTICLE = "minere:indigon_magic_short";
const ARMOR_KEYWORDS = [
  "helmet",
  "chestplate",
  "leggings",
  "boots",
  "armor",
  "crown",
];

export const PhasedEnderPearl: ItemCustomComponent = {
  onUse(data) {
    const player = data.source;
    if (!player) {
      return;
    }
    const cooldown = data?.itemStack.getComponent(
      ItemComponentTypes.Cooldown,
    ) as ItemCooldownComponent;
    cooldown.startCooldown(player);
    const dimension = player.dimension;
    if (player.getGameMode() != GameMode.Creative) {
      if (Math.random() <= CONSUME_CHANCE) {
        player.runCommand("clear @s[m=!c] minere:phased_ender_pearl 0 1");
      }
    }
    const equippable = player.getComponent(
      EntityComponentTypes.Equippable,
    ) as EntityEquippableComponent;
    let min = 12;
    let max = 20;
    if (isEnderonArmor(equippable?.getEquipment(EquipmentSlot.Head)?.typeId)) {
      min += 2;
      max += 1;
    }
    if (isEnderonArmor(equippable?.getEquipment(EquipmentSlot.Chest)?.typeId)) {
      min += 2;
      max += 1;
    }
    if (isEnderonArmor(equippable?.getEquipment(EquipmentSlot.Legs)?.typeId)) {
      min += 2;
      max += 1;
    }
    if (isEnderonArmor(equippable?.getEquipment(EquipmentSlot.Feet)?.typeId)) {
      min += 2;
      max += 1;
    }

    const ridingComponent = player.getComponent(
      EntityComponentTypes.Riding,
    ) as EntityRidingComponent;
    const mount = ridingComponent?.entityRidingOn;
    const mountEquippable = mount?.getComponent(
      EntityComponentTypes.Equippable,
    ) as EntityEquippableComponent | undefined;
    const mountHasEnderonArmor = isEnderonArmor(
      mountEquippable?.getEquipment(EquipmentSlot.Body)?.typeId,
    );

    const standingOnEnderonBlock = isStandingOnEnderonBlock(player);
    const offset = multiplyVector3Number(
      player.getViewDirection(),
      MULTIPLIER *
        (min + Math.random() * (max - min)) *
        (mountHasEnderonArmor ? 2 : 1) *
        (standingOnEnderonBlock ? 2 : 1),
    );
    offset.y += 1;
    const maxDistance = getTeleporterMaxDistance();
    const offsetDistance = distVector3({ x: 0, y: 0, z: 0 }, offset);
    if (offsetDistance > maxDistance) {
      const cappedOffset = multiplyVector3Number(
        offset,
        maxDistance / offsetDistance,
      );
      offset.x = cappedOffset.x;
      offset.y = cappedOffset.y;
      offset.z = cappedOffset.z;
    }
    const targetPos = addVector3(player.location, offset);
    targetPos.y = Math.max(dimension.heightRange.min + 2, targetPos.y);
    targetPos.y = Math.min(dimension.heightRange.max - 2, targetPos.y);
    let targetEntity: Entity = player;
    if (mount) {
      targetEntity = mount;
    }
    const origin = { ...targetEntity.location };
    const groundLookDistance = getGroundLookDistance(
      distVector3(origin, targetPos),
    );

    for (let i = 0; i <= groundLookDistance; i++) {
      const targetY = targetPos.y + i;
      if (targetY >= dimension.heightRange.max) {
        break;
      }
      const block = dimension.getBlock({
        x: targetPos.x,
        y: targetY,
        z: targetPos.z,
      });
      if (block.isValid && (block.isAir || block.isLiquid)) {
        targetPos.y = targetY;
        break;
      }
    }

    for (let i = 1; i <= groundLookDistance; i++) {
      const targetY = targetPos.y - i;
      if (targetY <= dimension.heightRange.min) {
        break;
      }
      const block = dimension.getBlock({
        x: targetPos.x,
        y: targetY,
        z: targetPos.z,
      });
      if (block.isValid && !block.isAir) {
        targetPos.y = targetY + 1;
        break;
      }
    }
    particleWave({
      dimension,
      particle: TELEPORT_PARTICLE,
      startLocation: { x: origin.x, y: origin.y + 1, z: origin.z },
      endLocation: { x: targetPos.x, y: targetPos.y + 1, z: targetPos.z },
      ticksPerStep: 0,
    });
    enderTeleport(targetEntity, targetPos);
  },
};

function isStandingOnEnderonBlock(player: Entity): boolean {
  const blockBelow = player.dimension.getBlock({
    x: Math.floor(player.location.x),
    y: Math.floor(player.location.y - 0.01),
    z: Math.floor(player.location.z),
  });
  return blockBelow?.isValid && blockBelow.typeId === ENDERON_BLOCK;
}

function isEnderonArmor(typeId: string | undefined): boolean {
  return (
    !!typeId &&
    hasIdentifierKeywords(typeId, [ENDERON]) &&
    hasAnyIdentifierKeyword(typeId, ARMOR_KEYWORDS)
  );
}

function getGroundLookDistance(teleportDistance: number): number {
  return Math.round(
    Math.max(
      MIN_GROUND_LOOK_DISTANCE,
      Math.min(
        MAX_GROUND_LOOK_DISTANCE,
        teleportDistance * GROUND_LOOK_DISTANCE_SCALE,
      ),
    ),
  );
}
