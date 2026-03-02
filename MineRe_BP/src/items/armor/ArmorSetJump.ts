import {
  system,
  Player,
  EntityComponentTypes,
  EntityEquippableComponent,
  EquipmentSlot,
  PlayerButtonInputAfterEvent,
  InputButton,
  InputMode,
  ButtonState,
} from "@minecraft/server";
import { isSolid } from "block/blockUtils";

type ArmorJumpConfig = {
  helmet: string;
  chestplate: string;
  leggings: string;
  boots: string;
  maxAirJumps: number;
  jumpImpulse: number;
  particle: string;
  sound: string;
  soundVolume?: number;
  soundPitch?: number;
};

const AIR_JUMPS_USED_PROPERTY = "minere:armor_air_jumps_used";
const groundResetRunners: Map<string, number> = new Map();
const MAX_Y_VEL_TO_DOUBLE_JUMP = 0.3;

const ARMOR_JUMP_CONFIGS: Map<string, ArmorJumpConfig> = new Map([
  [
    "aetherial",
    {
      helmet: "minere:aetherial_helmet",
      chestplate: "minere:aetherial_chestplate",
      leggings: "minere:aetherial_leggings",
      boots: "minere:aetherial_boots",
      maxAirJumps: 2,
      jumpImpulse: 0.65,
      particle: "minecraft:wind_explosion_emitter",
      sound: "breeze_wind_charge.burst",
      soundVolume: 0.5,
      soundPitch: 1.25,
    },
  ],
]);

export function handleArmorSetJump(data: PlayerButtonInputAfterEvent): void {
  const player = data.player;
  if (!player || !player.isValid) {
    return;
  }

  if (data.button === InputButton.Sneak && player.isOnGround) {
    setAirJumpsUsed(player, 0);
    return;
  }
  if (
    data.button !== InputButton.Jump ||
    data.newButtonState !== ButtonState.Pressed
  ) {
    return;
  }

  if (player.getVelocity().y > MAX_Y_VEL_TO_DOUBLE_JUMP) {
    return;
  }

  if (isPlayerGrounded(player)) {
    setAirJumpsUsed(player, 0);
    stopGroundResetRunner(player.id);
    return;
  }

  const config = getActiveArmorJumpConfig(player);
  if (!config) {
    return;
  }

  const usedJumps = getAirJumpsUsed(player);
  if (usedJumps >= config.maxAirJumps) {
    return;
  }

  player.applyImpulse({
    x: 0,
    y: config.jumpImpulse - Math.min(0, player.getVelocity().y),
    z: 0,
  });
  player.dimension.spawnParticle(config.particle, player.location);
  player.dimension.playSound(config.sound, player.location, {
    volume: config.soundVolume ?? 1.0,
    pitch: config.soundPitch ?? 1.0,
  });

  setAirJumpsUsed(player, usedJumps + 1);
  startGroundResetRunner(player);
}

function getActiveArmorJumpConfig(player: Player): ArmorJumpConfig | null {
  const equippable = player.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;
  if (!equippable) {
    return null;
  }

  const helmet = equippable.getEquipment(EquipmentSlot.Head);
  const chestplate = equippable.getEquipment(EquipmentSlot.Chest);
  const leggings = equippable.getEquipment(EquipmentSlot.Legs);
  const boots = equippable.getEquipment(EquipmentSlot.Feet);

  if (!helmet || !chestplate || !leggings || !boots) {
    return null;
  }

  for (const config of ARMOR_JUMP_CONFIGS.values()) {
    if (
      helmet.typeId === config.helmet &&
      chestplate.typeId === config.chestplate &&
      leggings.typeId === config.leggings &&
      boots.typeId === config.boots
    ) {
      return config;
    }
  }

  return null;
}

function getAirJumpsUsed(player: Player): number {
  const value = player.getDynamicProperty(AIR_JUMPS_USED_PROPERTY);
  if (typeof value !== "number") {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  return Math.floor(value);
}

function setAirJumpsUsed(player: Player, value: number): void {
  const safeValue = value < 0 ? 0 : Math.floor(value);
  player.setDynamicProperty(AIR_JUMPS_USED_PROPERTY, safeValue);
}

function isStandingOnSolidBlock(player: Player): boolean {
  const below = player.dimension.getBlock({
    x: player.location.x,
    y: player.location.y - 0.1,
    z: player.location.z,
  });

  if (!below) {
    return false;
  }

  return isSolid(below);
}

function isPlayerGrounded(player: Player): boolean {
  if (player.isOnGround) {
    return true;
  }
  return isStandingOnSolidBlock(player);
}

function startGroundResetRunner(player: Player): void {
  const playerId = player.id;
  if (groundResetRunners.has(playerId)) {
    return;
  }

  const runnerId = system.runInterval(() => {
    if (!player || !player.isValid) {
      stopGroundResetRunner(playerId);
      return;
    }

    if (isPlayerGrounded(player)) {
      setAirJumpsUsed(player, 0);
      stopGroundResetRunner(playerId);
    }
  }, 1);

  groundResetRunners.set(playerId, runnerId);
}

function stopGroundResetRunner(playerId: string): void {
  if (!groundResetRunners.has(playerId)) {
    return;
  }

  const runnerId = groundResetRunners.get(playerId);
  if (runnerId === undefined) {
    groundResetRunners.delete(playerId);
    return;
  }

  system.clearRun(runnerId);
  groundResetRunners.delete(playerId);
}
