import {
  EntityComponentTypes,
  EntityInventoryComponent,
  EntityProjectileComponent,
  GameMode,
  ItemComponentTypes,
  ItemCooldownComponent,
  ItemUseBeforeEvent,
  system,
} from "@minecraft/server";
import {
  findItemInContainer,
  getEnchantmentLevel,
} from "items/components/item_utils";
import { multiplyVector3Number } from "util/vector3Functions";
import { reduceDurability } from "../components/reduce_durability";
import { showHint } from "./staffHints";

const DARK_CHARGE_ITEM_ID = "minere:dark_charge";
const DARK_CHARGE_PROJECTILE_ID = "minere:dark_charge";
const AMMO_CONSUME_CHANCE = 0.67;
const INFINITY_AMMO_CONSUMPTION_MULTIPLIER = 0.25;
const SHADOW_TIME = 8 * 20;
const DARK_CHARGE_FLAME_PROPERTY = "minere:dark_charge_flame";
const DARK_CHARGE_POWER_PROPERTY = "minere:dark_charge_power";
const DARK_CHARGE_PUNCH_PROPERTY = "minere:dark_charge_punch";

export const useDarkStaff = (data: ItemUseBeforeEvent) => {
  if (!data.source || data.itemStack.typeId !== "minere:dark_staff") {
    return;
  }

  const source = data.source;
  const item = data.itemStack;
  const cooldown = item.getComponent(
    ItemComponentTypes.Cooldown,
  ) as ItemCooldownComponent;

  system.run(() => {
    if (cooldown?.getCooldownTicksRemaining(source)) {
      return;
    }

    if (source.isSneaking) {
      cooldown?.startCooldown(source);
      source.addEffect("blindness", SHADOW_TIME, { showParticles: false });
      source.addEffect("invisibility", SHADOW_TIME, {
        showParticles: false,
      });
      source.addEffect("speed", SHADOW_TIME, {
        showParticles: false,
        amplifier: 2,
      });
      source.addEffect("jump_boost", SHADOW_TIME, {
        showParticles: false,
        amplifier: 3,
      });
      source.addEffect("slow_falling", SHADOW_TIME, { showParticles: false });
      source.addEffect("regeneration", SHADOW_TIME, { showParticles: false });
      source.addEffect("weakness", SHADOW_TIME, { showParticles: false });
      source.dimension.playSound("item.echo_staff.whoosh", source.location);
      reduceDurability(source, item, 5);
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
        DARK_CHARGE_ITEM_ID,
      ) === -1
    ) {
      source.playSound("item.amethyst_staff.error");
      showHint(source, "hint.minere:staff.shadow.ammo");
      return;
    }

    const infinityLevel = getEnchantmentLevel(source, "infinity");
    if (
      Math.random() <
      AMMO_CONSUME_CHANCE *
        (infinityLevel > 0 ? INFINITY_AMMO_CONSUMPTION_MULTIPLIER : 1)
    ) {
      source.runCommand(`clear @s[m=!c] ${DARK_CHARGE_ITEM_ID} 0 1`);
    }

    cooldown?.startCooldown(source);
    reduceDurability(source, item, 1);
    source.dimension.playSound("item.dark_staff.whoosh", source.location);

    const direction = source.getViewDirection();
    const spawnLocation = {
      x: source.getHeadLocation().x + direction.x * 1.5,
      y: source.getHeadLocation().y - 0.5 + direction.y * 1.5,
      z: source.getHeadLocation().z + direction.z * 1.5,
    };
    const darkCharge = source.dimension.spawnEntity<string>(
      DARK_CHARGE_PROJECTILE_ID,
      spawnLocation,
    );
    const projectile = darkCharge.getComponent(
      EntityComponentTypes.Projectile,
    ) as EntityProjectileComponent;
    projectile.owner = source;
    darkCharge.setDynamicProperty(
      DARK_CHARGE_FLAME_PROPERTY,
      getEnchantmentLevel(source, "flame") > 0,
    );
    darkCharge.setDynamicProperty(
      DARK_CHARGE_POWER_PROPERTY,
      getEnchantmentLevel(source, "power"),
    );
    darkCharge.setDynamicProperty(
      DARK_CHARGE_PUNCH_PROPERTY,
      getEnchantmentLevel(source, "punch"),
    );
    darkCharge.setRotation({
      x: -source.getRotation().x,
      y: -source.getRotation().y,
    });
    darkCharge.applyImpulse(multiplyVector3Number(direction, 2.25));
  });
};
