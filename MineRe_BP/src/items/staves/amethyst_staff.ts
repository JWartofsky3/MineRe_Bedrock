import {
  system,
  world,
  Vector3,
  Entity,
  ItemUseBeforeEvent,
  EntityComponentTypes,
  EntityProjectileComponent,
  Dimension,
  ItemComponentTypes,
  ItemCooldownComponent,
  EntityInventoryComponent,
  GameMode,
} from "@minecraft/server";
import { multiplyVector3Number } from "util/vector3Functions";
import { reduceDurability } from "../components/reduce_durability";
import { findItemInContainer } from "../components/item_utils";
import { getRandomIntInclusive } from "util/mathFunctions";
import { showHint } from "./staffHints";

const SHIELD_RANGE = 4;
const HEAL_DURATION = 5 * 20;
const SHIELD_DURATION = 6 * 20;
const SHIELD_DURABILITY = 4;
const AMMO_CONSUME_CHANCE = 0.64;

export const useAmethystStaff = (data: ItemUseBeforeEvent) => {
  const itemStack = data.itemStack;
  const source = data.source;
  const dimension = world.getDimension(source.dimension.id);
  if (itemStack.typeId == "minere:amethyst_staff") {
    system.run(() => {
      if (source.isSneaking) {
        const cooldownComponent = data?.itemStack.getComponent(
          ItemComponentTypes.Cooldown,
        ) as ItemCooldownComponent;
        if (cooldownComponent) {
          if (cooldownComponent.getCooldownTicksRemaining(source)) {
            source.playSound("item.amethyst_staff.error");
            return;
          }
          cooldownComponent.startCooldown(source);
        }
        if (
          !source.runCommand(
            `clear @s[m=!c] amethyst_shard 0 ${getRandomIntInclusive(2, 3)}`,
          ).successCount &&
          source.getGameMode() !== GameMode.Creative
        ) {
          source.playSound("item.amethyst_staff.error");
          showHint(source, "hint.minere:staff.amethyst.ammo");
          return;
        }
        const nearbyEntities = dimension.getEntities({
          location: source.location,
          maxDistance: SHIELD_RANGE,
          excludeFamilies: ["monster", "item", "inanimate"],
        });
        nearbyEntities.forEach((nearbyEntity: Entity) => {
          nearbyEntity.addEffect("regeneration", HEAL_DURATION, {
            amplifier: 1.0,
          });
        });
        generateShield(
          source.location,
          dimension,
          SHIELD_RANGE,
          SHIELD_DURATION,
        );
        reduceDurability(source, itemStack, SHIELD_DURABILITY);
      } else {
        if (
          source.getGameMode() !== GameMode.Creative &&
          findItemInContainer(
            (
              source.getComponent(
                EntityComponentTypes.Inventory,
              ) as EntityInventoryComponent
            )?.container,
            "minecraft:amethyst_shard",
          ) === -1
        ) {
          source.playSound("item.amethyst_staff.error");
          showHint(source, "hint.minere:staff.amethyst.ammo");
          return;
        }
        if (Math.random() < AMMO_CONSUME_CHANCE) {
          source.runCommand("clear @s[m=!c] amethyst_shard 0 1");
        }

        dimension.playSound("step.amethyst_block", source.location);
        let loc = {
          x: source.location.x + source.getViewDirection().x * 1.5,
          y: source.location.y + 1.5 + source.getViewDirection().y * 1.5,
          z: source.location.z + source.getViewDirection().z * 1.5,
        };
        let fireball = source.dimension.spawnEntity(
          "minere:amethyst_projectile",
          loc,
        );
        const proj = fireball.getComponent(
          EntityComponentTypes.Projectile,
        ) as EntityProjectileComponent;
        proj.owner = source;
        fireball.setRotation({
          x: -1 * source.getRotation().x,
          y: -1 * source.getRotation().y,
        });
        fireball.applyImpulse(
          multiplyVector3Number(source.getViewDirection(), 3.0),
        );
        if (source.getGameMode() === GameMode.Creative) {
          return;
        }
        reduceDurability(source, itemStack, 1);
      }
    });
  }
};

function generateShield(
  position: Vector3,
  dimension: Dimension,
  size: number,
  lifespan: number,
) {
  let insideSize = size - 1;
  let timeout = 0;
  for (let i = size; i >= -size; i--) {
    let thisI = i;
    system.runTimeout(() => {
      dimension.runCommand(
        `fill ${position.x - size} ${position.y + thisI} ${position.z - size} ${position.x + size} ${position.y + thisI} ${position.z + size} minere:amethyst_shield replace air`,
      );
      dimension.runCommand(
        `fill ${position.x - size} ${position.y + thisI} ${position.z - size} ${position.x + size} ${position.y + thisI} ${position.z + size} minere:amethyst_shield replace tall_grass`,
      );
      dimension.playSound("step.amethyst_block", {
        x: position.x,
        y: position.y + thisI,
        z: position.z,
      });
      if (Math.abs(thisI) != size) {
        dimension.runCommand(
          `fill ${position.x - insideSize} ${position.y + thisI} ${position.z - insideSize} ${position.x + insideSize} ${position.y + thisI} ${position.z + insideSize} air replace minere:amethyst_shield`,
        );
      }
    }, timeout);
    timeout += 2;
  }
  system.runTimeout(() => {
    cleanupShield(position, dimension, size);
  }, lifespan);
}

function cleanupShield(position: Vector3, dimension: Dimension, size: number) {
  let timeout = 0;
  for (let i = size; i >= -size; i--) {
    let thisI = i;
    system.runTimeout(() => {
      dimension.runCommand(
        `fill ${position.x - size} ${position.y + thisI} ${position.z - size} ${position.x + size} ${position.y + thisI} ${position.z + size} air replace minere:amethyst_shield`,
      );
      dimension.playSound("step.amethyst_block", {
        x: position.x,
        y: position.y + thisI,
        z: position.z,
      });
    }, timeout);
    timeout += 2;
  }
}
