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
} from "@minecraft/server";
import { rollFreeze } from "entities/functions/freeze";
import { consumeXp } from "entities/functions/consumeXp";
import { freezeArea } from "functions/freezeArea";
import { particleWave } from "particles/particleWave";
import {
  addVector3,
  magnitudeVector3,
  multiplyVector3Number,
  normalizeVector3,
} from "util/vector3Functions";
import { reduceDurability } from "../components/reduce_durability";
import { findItemInContainer } from "items/components/item_utils";

const XP_COST = 6;
const MAX_RANGE = 16;
const WAVE_COUNT = 4;
const WAVE_DELAY = 5;
const WAVE_STEP_DISTANCE = 1.0;
const WAVE_RADIUS = 2;
const DAMAGE_RANGE = 2.5;
const FREEZE_SOUND = "item.ice_charge.frost";
const WAVE_SOUND = "mob.freeze.freeze";
const WAVE_PARTICLE = "minere:ice_staff_wave";
const AMMO_CONSUME_CHANCE = 0.8;

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

  system.run(() => {
    if (cooldownComponent?.getCooldownTicksRemaining(source)) {
      return;
    }
        if (
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
          return;
        }
        if (Math.random() < AMMO_CONSUME_CHANCE) {
          source.runCommand("clear @s[m=!c] minere:ice_charge 0 1");
        }

    cooldownComponent.startCooldown(source);
    reduceDurability(source, itemStack, 1);
    dimension.playSound(FREEZE_SOUND, source.location);

    const entitiesHit = new Set<string>();

    for (let i = 0; i < WAVE_COUNT; i++) {
      system.runTimeout(() => {
        const sourcePos = source.getHeadLocation();
        const sourceDir = getAimDirection(source.getViewDirection());
        const targetLocation =
          source.getBlockFromViewDirection({
            maxDistance: MAX_RANGE,
            includeLiquidBlocks: true,
            includePassableBlocks: true,
          })?.block?.location ??
          addVector3(
            sourcePos,
            multiplyVector3Number(sourceDir, MAX_RANGE),
          );
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
