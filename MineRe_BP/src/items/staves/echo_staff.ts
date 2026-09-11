import {
  system,
  world,
  ItemUseBeforeEvent,
  EntityDamageCause,
  EntityRaycastHit,
  Entity,
  ItemComponentTypes,
  ItemCooldownComponent,
  EntityComponentTypes,
  EntityEquippableComponent,
  EquipmentSlot,
  Dimension,
} from "@minecraft/server";
import { reduceDurability } from "../components/reduce_durability";
import { DEFAULT_TICK } from "main";
import { consumeXp } from "entities/functions/consumeXp";
import {
  addVector3,
  distVector3,
  multiplyVector3Number,
} from "util/vector3Functions";
import { isAlive } from "mob/mob_utils";
import { showHint } from "./staffHints";
import { getEnchantmentLevel } from "items/components/item_utils";
import { throwEntity } from "entities/functions/throw";

const SHADOW_COOLDOWN = "echo_shadow_cooldown";
const SHADOW_TIME = 4 * 20;
const SHADOW_XP_COST = 10; // xp
const SHADOW_DURABILITY_COST = 5;
const SHADOW_RANGE = 8;
const SONIC_RANGE = 32;
const SONIC_DAMAGE = 32;
const SONIC_SPLASH_RANGE = 5;
const SONIC_SPLASH_DAMAGE = 16;
const SONIC_XP_COST = 10; // xp
const SONIC_DURABILITY_COST = 5;
const cooldownTime = 10;

const igniteAirCube = (
  dimension: Dimension,
  location: { x: number; y: number; z: number },
) => {
  const center = {
    x: Math.floor(location.x),
    y: Math.floor(location.y),
    z: Math.floor(location.z),
  };
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const block = dimension.getBlock({
          x: center.x + x,
          y: center.y + y,
          z: center.z + z,
        });
        if (block?.typeId === "minecraft:air" && Math.random() < 0.25) {
          block.setType("minecraft:fire");
        }
      }
    }
  }
};

const applySonicEnchantments = (
  source: Entity,
  entity: Entity,
  punchLevel: number,
  flameLevel: number,
) => {
  if (punchLevel > 0) {
    throwEntity(source.location, entity, punchLevel * 1.5, punchLevel * 0.5);
  }
  if (flameLevel > 0) {
    entity.setOnFire(5);
  }
};

export const useEchoStaff = (data: ItemUseBeforeEvent) => {
  if (!data.source) {
    return;
  }
  const itemStack = data.itemStack;
  const source = data.source;
  const dimension = world.getDimension(source.dimension.id);
  const cooldownComponent = data?.itemStack.getComponent(
    ItemComponentTypes.Cooldown,
  ) as ItemCooldownComponent;
  if (itemStack.typeId == "minere:echo_staff") {
    system.run(() => {
      if (source.isSneaking) {
        // check cooldown property
        const cooldownProperty = source.getDynamicProperty(SHADOW_COOLDOWN);
        if (
          !!cooldownProperty &&
          typeof cooldownProperty == "number" &&
          system.currentTick - cooldownProperty < cooldownTime * DEFAULT_TICK
        ) {
          source.playSound("item.amethyst_staff.error");
          return;
        }
        // check cooldown component
        if (cooldownComponent) {
          if (cooldownComponent.getCooldownTicksRemaining(source)) {
            source.playSound("item.amethyst_staff.error");
            return;
          }
        }
        if (consumeXp(source, SHADOW_XP_COST)) {
          cooldownComponent.startCooldown(source);
          source.setDynamicProperty(SHADOW_COOLDOWN, system.currentTick);
          source.dimension.playSound("item.echo_staff.whoosh", source.location);
          source.addEffect("blindness", SHADOW_TIME, { showParticles: false });
          source.addEffect("invisibility", SHADOW_TIME, {
            showParticles: false,
          });
          source.addEffect("speed", SHADOW_TIME, {
            showParticles: false,
            amplifier: 4,
          });
          source.addEffect("jump_boost", SHADOW_TIME, {
            showParticles: false,
            amplifier: 3,
          });
          source.addEffect("slow_falling", SHADOW_TIME, {
            showParticles: false,
          });
          source.addEffect("regeneration", SHADOW_TIME, {
            showParticles: false,
          });
          source.addEffect("weakness", SHADOW_TIME, {
            showParticles: false,
          });
          // apply negative effects to nearby entities
          const nearbyEntities = dimension.getEntities({
            location: source.location,
            maxDistance: SHADOW_RANGE,
          });
          nearbyEntities.forEach((entity: Entity) => {
            entity.addEffect("blindness", SHADOW_TIME / 2, {
              showParticles: false,
            });
          });
          for (let i = 0; i < SHADOW_TIME / 4; i++) {
            system.runTimeout(() => {
              nearbyEntities.forEach((entity: Entity) => {
                if (entity?.location) {
                  dimension.spawnParticle("minecraft:sonic_explosion", {
                    x: entity.location.x,
                    y: entity.location.y + 1,
                    z: entity.location.z,
                  });
                }
              });
            }, i * 4);
          }
          reduceDurability(source, itemStack, SHADOW_DURABILITY_COST);
        } else {
          source.playSound("item.amethyst_staff.error");
          showHint(source, "hint.minere:staff.echo.shadow_xp");
        }
        return;
      } else {
        if (cooldownComponent) {
          if (cooldownComponent.getCooldownTicksRemaining(source)) {
            source.playSound("item.amethyst_staff.error");
            return;
          }
        }
        if (!consumeXp(source, SONIC_XP_COST)) {
          source.playSound("item.amethyst_staff.error");
          showHint(source, "hint.minere:staff.echo.sonic_xp");
          return;
        }
        cooldownComponent.startCooldown(source);
        source.dimension.playSound("mob.warden.sonic_charge", source.location);
        system.runTimeout(() => {
          const equippable = source.getComponent(
            EntityComponentTypes.Equippable,
          ) as EntityEquippableComponent;
          if (
            equippable?.getEquipment(EquipmentSlot.Mainhand)?.typeId !==
            itemStack.typeId
          ) {
            source.playSound("item.amethyst_staff.error");
            return;
          }
          const infinityLevel = getEnchantmentLevel(source, "infinity");
          const powerLevel = getEnchantmentLevel(source, "power");
          const punchLevel = getEnchantmentLevel(source, "punch");
          const flameLevel = getEnchantmentLevel(source, "flame");
          const sonicRange = SONIC_RANGE * (infinityLevel > 0 ? 2 : 1);
          const sonicDamage = SONIC_DAMAGE + powerLevel * 2;
          const sonicSplashDamage = SONIC_SPLASH_DAMAGE + powerLevel * 2;
          // get direct hits
          const raycastHits = source.getEntitiesFromViewDirection({
            maxDistance: sonicRange,
            includeLiquidBlocks: false,
            includePassableBlocks: false,
          });
          raycastHits.forEach((raycastHit: EntityRaycastHit) => {
            const entity = raycastHit.entity;
            if (entity?.location) {
              dimension.spawnParticle(
                "minecraft:sonic_explosion",
                entity.location,
              );
            }
          });

          // get splash hits
          let targetLocation = source.getBlockFromViewDirection({
            maxDistance: sonicRange,
            includeLiquidBlocks: false,
            includePassableBlocks: false,
          })?.block?.location;
          if (!targetLocation) {
            targetLocation = addVector3(
              source.getHeadLocation(),
              multiplyVector3Number(source.getViewDirection(), sonicRange),
            );
          }
          const splashEntities = dimension
            .getEntities({
              location: targetLocation,
              maxDistance: SONIC_SPLASH_RANGE,
            })
            .filter((entity: Entity) => entity !== source && isAlive(entity));
          splashEntities.forEach((entity: Entity) => {
            if (entity?.location) {
              dimension.spawnParticle(
                "minecraft:sonic_explosion",
                entity.location,
              );
            }
          });
          // generate line of particles
          const dist = distVector3(source.location, targetLocation);
          for (let i = 1; i < dist; i++) {
            dimension.spawnParticle(
              "minecraft:sonic_explosion",
              addVector3(
                source.getHeadLocation(),
                multiplyVector3Number(source.getViewDirection(), i),
              ),
            );
          }
          system.runTimeout(() => {
            reduceDurability(source, itemStack, SONIC_DURABILITY_COST);
            source.dimension.playSound(
              "mob.warden.sonic_boom",
              source.location,
            );
            source.dimension.playSound("mob.warden.sonic_boom", targetLocation);
            if (flameLevel > 0) {
              igniteAirCube(dimension, targetLocation);
            }
            raycastHits.forEach((raycastHit: EntityRaycastHit) => {
              const entity = raycastHit.entity;
              if (!isAlive(entity)) {
                return;
              }
              // Calculate distance to target
              const distance = distVector3(source.location, entity.location);

              // Calculate damage multiplier
              let damageMultiplier = 1;
              if (distance > sonicRange / 2) {
                const excess = distance - sonicRange / 2;
                const falloffRange = sonicRange / 2;
                damageMultiplier = 1 - (excess / falloffRange) * 0.5;
                if (damageMultiplier < 0.5) {
                  damageMultiplier = 0.5; // clamp
                }
              }

              // Apply scaled damage
              entity.applyDamage(sonicDamage * damageMultiplier, {
                damagingEntity: source,
                damagingProjectile: source,
                cause:
                  entity.typeId === "minecraft:player"
                    ? EntityDamageCause.entityAttack
                    : EntityDamageCause.sonicBoom,
              });
              applySonicEnchantments(
                source,
                entity,
                punchLevel,
                flameLevel,
              );
            });
            splashEntities.forEach((entity: Entity) => {
              if (entity?.location) {
                entity.applyDamage(sonicSplashDamage, {
                  damagingEntity: source,
                  damagingProjectile: source,
                  cause:
                    entity.typeId === "minecraft:player"
                      ? EntityDamageCause.entityAttack
                      : EntityDamageCause.sonicBoom,
                });
                applySonicEnchantments(
                  source,
                  entity,
                  punchLevel,
                  flameLevel,
                );
              }
            });
          }, 10);
        }, 30);
      }
    });
  }
};
