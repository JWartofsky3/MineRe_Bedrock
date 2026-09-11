import {
  system,
  world,
  ItemUseBeforeEvent,
  EntityComponentTypes,
  EntityProjectileComponent,
  EntityInventoryComponent,
  ItemComponentTypes,
  ItemCooldownComponent,
  EntityEquippableComponent,
  EquipmentSlot,
  GameMode,
} from "@minecraft/server";
import { multiplyVector3Number } from "util/vector3Functions";
import { reduceDurability } from "../components/reduce_durability";
import { showHint } from "./staffHints";
import {
  findItemInContainer,
  getEnchantmentLevel,
} from "../components/item_utils";

const AMMO_CONSUME_CHANCE = 0.5;
const INFINITY_AMMO_CONSUMPTION_MULTIPLIER = 0.5;
const PLASMA_POWER_PROPERTY = "minere:blaster_plasma_power";
const PLASMA_PUNCH_PROPERTY = "minere:blaster_plasma_punch";
const PLASMA_FLAME_PROPERTY = "minere:blaster_plasma_flame";

export const useBlasterStaff = (data: ItemUseBeforeEvent) => {
  const itemStack = data.itemStack;
  const source = data.source;
  const dimension = world.getDimension(source.dimension.id);
  if (itemStack.typeId == "minere:blaster_staff") {
    system.run(() => {
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
      dimension.playSound("mob.walker.warn", source.location, {
        pitch: 1.0,
      });
      system.runTimeout(() => {
        const equippable = source.getComponent(
          EntityComponentTypes.Equippable,
        ) as EntityEquippableComponent;
        if (
          equippable?.getEquipment(EquipmentSlot.Mainhand)?.typeId !==
          itemStack.typeId
        ) {
          source.playSound("item.amethyst_staff.error");
          showHint(source, "hint.minere:staff.blaster.ammo");
          return;
        }
        const inventory = source.getComponent(
          EntityComponentTypes.Inventory,
        ) as EntityInventoryComponent;
        if (
          source.getGameMode() !== GameMode.Creative &&
          findItemInContainer(inventory?.container, "minere:ender_plasma") ===
            -1
        ) {
          source.playSound("item.amethyst_staff.error");
          return;
        }
        const infinityLevel = getEnchantmentLevel(source, "infinity");
        if (
          source.getGameMode() !== GameMode.Creative &&
          Math.random() <
            AMMO_CONSUME_CHANCE *
              (infinityLevel > 0 ? INFINITY_AMMO_CONSUMPTION_MULTIPLIER : 1)
        ) {
          source.runCommand("clear @s[m=!c] minere:ender_plasma 0 1");
        }

        dimension.playSound("mob.walker.shoot", source.location);
        let loc = {
          x: source.location.x + source.getViewDirection().x * 1.5,
          y: source.location.y + 1.5 + source.getViewDirection().y * 1.5,
          z: source.location.z + source.getViewDirection().z * 1.5,
        };
        let plasmaBolt = source.dimension.spawnEntity<string>(
          "minere:plasma_bolt",
          loc,
        );
        plasmaBolt.triggerEvent("minere:activate_player_laser");
        const proj = plasmaBolt.getComponent(
          EntityComponentTypes.Projectile,
        ) as EntityProjectileComponent;
        proj.owner = source;
        plasmaBolt.setDynamicProperty(
          PLASMA_POWER_PROPERTY,
          getEnchantmentLevel(source, "power"),
        );
        plasmaBolt.setDynamicProperty(
          PLASMA_PUNCH_PROPERTY,
          getEnchantmentLevel(source, "punch"),
        );
        plasmaBolt.setDynamicProperty(
          PLASMA_FLAME_PROPERTY,
          getEnchantmentLevel(source, "flame") > 0,
        );
        plasmaBolt.setRotation({
          x: -1 * source.getRotation().x,
          y: -1 * source.getRotation().y,
        });
        plasmaBolt.applyImpulse(
          multiplyVector3Number(source.getViewDirection(), 7.0),
        );
        if (source.getGameMode() === GameMode.Creative) {
          return;
        }
        reduceDurability(source, itemStack, 4);
      }, 20);
    });
  }
};
