import {
  system,
  world,
  ItemUseBeforeEvent,
  ItemComponentTypes,
  ItemCooldownComponent,
  Vector3,
  GameMode,
  EntityComponentTypes,
  EntityInventoryComponent,
  EntityDamageCause,
} from "@minecraft/server";
import { rollFreeze } from "entities/functions/freeze";
import { freezeArea } from "functions/freezeArea";
import { particleWave } from "particles/particleWave";
import { spawnParticleCloud } from "particles/particleCloud";
import {
  addVector3,
  magnitudeVector3,
  multiplyVector3Number,
  normalizeVector3,
} from "util/vector3Functions";
import { reduceDurability } from "../components/reduce_durability";
import { findItemInContainer } from "items/components/item_utils";
import { isFireMob } from "entities/functions/isFireMob";
import { showHint } from "./staffHints";
import { getEnchantmentLevel } from "items/components/item_utils";
import { isWearingIceCrown } from "items/armor/IceCrown";

const MAX_RANGE = 19;
const WAVE_COUNT = 4;
const WAVE_DELAY = 5;
const WAVE_STEP_DISTANCE = 1.0;
const WAVE_RADIUS = 2;
const DAMAGE = 5;
const DAMAGE_RANGE = 2.5;
const SNEAK_FREEZE_RADIUS = 5;
const SNEAK_AMMO_COST = 1;
const FREEZE_SOUND = "item.ice_charge.frost";
const WAVE_SOUND = "mob.freeze.freeze";
const WAVE_PARTICLE = "minere:ice_staff_wave";
const AMMO_CONSUME_CHANCE = 0.64;
const ATTACK_COOLDOWN_PROPERTY = "minere:ice_staff_attack_cooldown";
const ATTACK_COOLDOWN_SECONDS = 3.2;
const QUICK_CHARGE_REDUCTION_SECONDS = 0.15;

export const useIceStaff = (data: ItemUseBeforeEvent) => {
  if (!data.source) {
    return;
  }
  const itemStack = data.itemStack;
  const source = data.source;
  const dimension = world.getDimension(source.dimension.id);
  const cooldownComponent = data.itemStack.getComponent(
    ItemComponentTypes.Cooldown,
  ) as ItemCooldownComponent;

  if (itemStack.typeId !== "minere:ice_staff") {
    return;
  }
  if (!source.isSneaking) {
    data.cancel = true;
  }

  system.run(() => {
    if (cooldownComponent?.getCooldownTicksRemaining(source)) {
      return;
    }
    if (source.isSneaking) {
      if (
        !isWearingIceCrown(source) &&
        !source.runCommand(
          `clear @s[m=!c] minere:ice_charge 0 ${SNEAK_AMMO_COST}`,
        ).successCount &&
        source.getGameMode() !== GameMode.Creative
      ) {
        source.playSound("item.amethyst_staff.error");
        showHint(source, "hint.minere:staff.ice.ammo");
        return;
      }

      cooldownComponent.startCooldown(source);
      reduceDurability(source, itemStack, 6);
      dimension.playSound(FREEZE_SOUND, source.location);
      spawnParticleCloud(
        "minere:ice_charge_particles",
        source.location,
        SNEAK_FREEZE_RADIUS,
        40,
        dimension,
      );
      freezeArea(dimension, source.location, {
        radius: SNEAK_FREEZE_RADIUS,
        verticalRadius: SNEAK_FREEZE_RADIUS,
        coverWithSnow: true,
        ticksPerStep: 3,
        playSound: false,
      });

      const entities = dimension.getEntities({
        location: source.location,
        maxDistance: SNEAK_FREEZE_RADIUS,
        excludeTypes: ["minecraft:item"],
      });
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        if (entity.id === source.id) {
          continue;
        }
        rollFreeze(entity);
      }
      return;
    }

    const quickChargeLevel = getEnchantmentLevel(source, "quick_charge");
    const cooldown = source.getDynamicProperty(ATTACK_COOLDOWN_PROPERTY);
    const cooldownTicks = Math.max(
      0,
      (ATTACK_COOLDOWN_SECONDS -
        quickChargeLevel * QUICK_CHARGE_REDUCTION_SECONDS) *
        20,
    );
    if (
      typeof cooldown === "number" &&
      system.currentTick - cooldown < cooldownTicks
    ) {
      source.playSound("item.amethyst_staff.error");
      return;
    }

    if (
      !isWearingIceCrown(source) &&
      source.getGameMode() !== GameMode.Creative &&
      findItemInContainer(
        (
          source.getComponent(
            EntityComponentTypes.Inventory,
          ) as EntityInventoryComponent
        )?.container,
        "minere:ice_charge",
      ) === -1
    ) {
      source.playSound("item.amethyst_staff.error");
      showHint(source, "hint.minere:staff.ice.ammo");
      return;
    }
    if (!isWearingIceCrown(source) && Math.random() < AMMO_CONSUME_CHANCE) {
      source.runCommand("clear @s[m=!c] minere:ice_charge 0 1");
    }

    source.setDynamicProperty(ATTACK_COOLDOWN_PROPERTY, system.currentTick);
    reduceDurability(source, itemStack, 1);
    dimension.playSound(FREEZE_SOUND, source.location);

    const entitiesHit = new Set<string>();

    const multishotLevel = getEnchantmentLevel(source, "multishot");
    const piercingLevel = getEnchantmentLevel(source, "piercing");
    const waveCount = multishotLevel > 0 ? 6 : WAVE_COUNT;
    for (let i = 0; i < waveCount; i++) {
      system.runTimeout(() => {
        const sourcePos = source.getHeadLocation();
        const sourceDir = getAimDirection(source.getViewDirection());
        const targetLocation =
          source.getBlockFromViewDirection({
            maxDistance: MAX_RANGE,
            includeLiquidBlocks: true,
            includePassableBlocks: true,
          })?.block?.location ??
          addVector3(sourcePos, multiplyVector3Number(sourceDir, MAX_RANGE));
        const endPos = {
          x: targetLocation.x,
          y: targetLocation.y,
          z: targetLocation.z,
        };

        particleWave({
          dimension,
          particle: WAVE_PARTICLE,
          startLocation: sourcePos,
          endLocation: endPos,
          stepDistance: WAVE_STEP_DISTANCE,
          ticksPerStep: 1,
          soundEffect: WAVE_SOUND,
          soundOptions: { volume: 0.25 },
          effect: (wave) => {
            freezeArea(dimension, wave.location, {
              radius: WAVE_RADIUS,
              verticalRadius: WAVE_RADIUS,
              coverWithSnow: false,
              ticksPerStep: 0,
              playSound: false,
            });
          },
          entityOptions: {
            filter: {
              location: sourcePos,
              maxDistance: DAMAGE_RANGE,
            },
            excludeIds: [source.id],
            effect: (entity) => {
              if (entitiesHit.has(entity.id)) {
                return;
              }
              entitiesHit.add(entity.id);
              rollFreeze(entity);
              let damage = DAMAGE + piercingLevel * 2;
              if (isFireMob(entity)) {
                damage *= 3;
              }
              entity.applyDamage(damage, {
                damagingEntity: source,
                cause: EntityDamageCause.freezing,
              });
            },
          },
        });
      }, i * WAVE_DELAY);
    }
  });
};

function getAimDirection(direction: Vector3): Vector3 {
  if (magnitudeVector3(direction) <= 0.001) {
    return { x: 0, y: 0, z: 1 };
  }
  return normalizeVector3(direction);
}
