import {
  ItemCustomComponent,
  ItemComponentTypes,
  ItemCooldownComponent,
  system,
  EntityDamageCause,
} from "@minecraft/server";
import { getHealth, isAlive, isFamily } from "entities/utilities/common";
import { spawnParticleCloud } from "particles/particleCloud";
import {
  addVector3,
  multiplyVector3Number,
  rotateVectorY,
} from "util/vector3Functions";
import { reduceDurability } from "./reduce_durability";
import { lifesteal } from "entities/functions/lifesteal";

const CLOUD_DAMAGE = 8;
const CLOUD_DISTANCE = 3;
const CLOUD_RADIUS = 2.0;
const CLOUD_DELAY = 4;
const CLOUD_COUNT = 20;
const CLOUD_SPREAD = [-50, -25, 0, 25, 50];
const HEAL_PER_UNDEAD_HIT = 1.0;
const DURABILITY_COST = 3;
const PARTICLE_ID = "minere:darkheart_soul_particle";
const SOUND_ID = "mob.wither.ambient";
const SOUND_PITCH = 1.5;
const SOUND_VOLUME = 1.5;
const WEAKNESS_DURATION = 20 * 6;
const LIFESTEAL = 1.0;
const LIFESTEAL_KILL = 3.0;

export const ShadowScythe: ItemCustomComponent = {
  onHitEntity(arg) {
    if (!arg.hadEffect || !arg.hitEntity) {
      return;
    }
    lifesteal(arg.attackingEntity, arg.hitEntity, {
      lifesteal: LIFESTEAL,
      lifestealOnKill: LIFESTEAL_KILL,
      subtractHealth: true,
    });
  },
  onUse(arg) {
    const source = arg.source;
    if (!source?.isValid || !arg.itemStack) {
      return;
    }
    const cooldownComponent = arg.itemStack.getComponent(
      ItemComponentTypes.Cooldown,
    ) as ItemCooldownComponent;
    if (cooldownComponent) {
      cooldownComponent.startCooldown(source);
    }

    reduceDurability(source, arg.itemStack, DURABILITY_COST);
    const dimension = source.dimension;
    const baseLocation = {
      x: source.location.x,
      y: source.location.y + 1,
      z: source.location.z,
    };
    const baseDirection = source.getViewDirection();

    for (let i = 0; i < CLOUD_SPREAD.length; i++) {
      const angle = CLOUD_SPREAD[i];
      const direction = rotateVectorY(baseDirection, angle);
      const cloudLocation = addVector3(
        baseLocation,
        multiplyVector3Number(direction, CLOUD_DISTANCE),
      );

      system.runTimeout(() => {
        if (!source.isValid) {
          return;
        }

        spawnParticleCloud(
          PARTICLE_ID,
          cloudLocation,
          CLOUD_RADIUS * 0.5,
          CLOUD_COUNT,
          dimension,
        );
        dimension.playSound(SOUND_ID, cloudLocation, {
          pitch: SOUND_PITCH,
          volume: SOUND_VOLUME,
        });

        const entities = dimension.getEntities({
          location: cloudLocation,
          maxDistance: CLOUD_RADIUS,
        });
        for (const entity of entities) {
          if (!isAlive(entity) || entity.id === source.id) {
            continue;
          }

          entity.applyDamage(CLOUD_DAMAGE, {
            damagingEntity: source,
            cause: EntityDamageCause.magic,
          });
          entity.addEffect("weakness", WEAKNESS_DURATION);

          if (!isFamily(entity, "undead")) {
            continue;
          }

          const sourceHealth = getHealth(source);
          if (!sourceHealth) {
            continue;
          }

          sourceHealth.setCurrentValue(
            Math.min(
              sourceHealth.effectiveMax,
              sourceHealth.currentValue + HEAL_PER_UNDEAD_HIT,
            ),
          );
        }
      }, i * CLOUD_DELAY);
    }
  },
};
