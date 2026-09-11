import {
  Entity,
  EntityComponentTypes,
  EntityDieAfterEvent,
  EntityHealthComponent,
  EntityInventoryComponent,
  EntitySpawnAfterEvent,
  ItemStack,
  system,
} from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";

const CORRUPTED_INDIGON_GOLEM = "minere:corrupted_indigon_golem";
const INITIALIZED_PROPERTY = "minere:corrupted_golem_initialized";
const ABILITY_PROPERTY = "minere:corrupted_golem_ability";
const SUPERCHARGE_COOLDOWN_PROPERTY =
  "minere:corrupted_golem_supercharge_cooldown";
const SUPERCHARGE_COOLDOWN_TICKS = 45 * 20;
const SUPERCHARGE_DURATION_TICKS = 30 * 20;
const SUPERCHARGE_RADIUS = 16;
const SUMMON_ANIMATION_TICKS = 2 * 20;
const SUPERCHARGE_TARGETS = new Set([
  CORRUPTED_INDIGON_GOLEM,
  "minecraft:wither_skeleton",
  "minecraft:wither",
]);
const CRITICAL_HEALTH_THRESHOLD = 0.5;

/** Gives ability-bearing corrupted golems their initial ammunition once. */
export class CorruptedIndigonGolem extends BaseCustomEntity {
  constructor() {
    super(CORRUPTED_INDIGON_GOLEM, { tick: 20 });
  }

  onEntitySpawn = (data: EntitySpawnAfterEvent): void => {
    system.run(() => {
      const golem = data.entity;
      if (
        !golem.isValid ||
        golem.getDynamicProperty(INITIALIZED_PROPERTY) === true
      ) {
        return;
      }

      const inventory = golem.getComponent(
        EntityComponentTypes.Inventory,
      ) as EntityInventoryComponent | undefined;
      const container = inventory?.container;
      if (!container) {
        return;
      }

      const ability = golem.getProperty(ABILITY_PROPERTY);
      if (ability === 1) {
        container.setItem(
          0,
          new ItemStack("minecraft:echo_shard", randomAmount(1, 2)),
        );
      } else if (ability === 2) {
        container.setItem(
          0,
          new ItemStack("minere:ender_plasma", randomAmount(2, 4)),
        );
      }
      golem.setDynamicProperty(INITIALIZED_PROPERTY, true);
    });
  };

  onLoad = (golem: Entity): void => {
    golem.triggerEvent("minere:end_supercharge");
  };

  onEntityDie = (data: EntityDieAfterEvent): void => {
    const golem = data.deadEntity;
    const inventory = golem.getComponent(
      EntityComponentTypes.Inventory,
    ) as EntityInventoryComponent | undefined;
    const container = inventory?.container;
    if (!container) {
      return;
    }

    for (let slot = 0; slot < container.size; slot++) {
      const item = container.getItem(slot);
      if (item) {
        golem.dimension.spawnItem(item, golem.location);
      }
    }
  };

  onTick = (golem: Entity): void => {
    if (!isSuperchargeReady(golem)) {
      return;
    }

    const targets = golem.dimension
      .getEntities({
        location: golem.location,
        maxDistance: SUPERCHARGE_RADIUS,
      })
      .filter((entity) => entity.isValid && SUPERCHARGE_TARGETS.has(entity.typeId) && getHealthRatio(entity) < CRITICAL_HEALTH_THRESHOLD);

    if (targets.length === 0) {
      return;
    }

    golem.setDynamicProperty(SUPERCHARGE_COOLDOWN_PROPERTY, system.currentTick);
    golem.playAnimation("animation.minere.indigon_golem.summon");
    golem.triggerEvent("minere:supercharge");
    system.runTimeout(() => {
      if (golem.isValid) {
        golem.triggerEvent("minere:end_supercharge");
      }
      for (const target of targets) {
        if (target.isValid) {
          applySupercharge(target);
        }
      }
    }, SUMMON_ANIMATION_TICKS);
  };
}

function randomAmount(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isSuperchargeReady(golem: Entity): boolean {
  const cooldownStartedAt = golem.getDynamicProperty(
    SUPERCHARGE_COOLDOWN_PROPERTY,
  );
  return (
    typeof cooldownStartedAt !== "number" ||
    system.currentTick - cooldownStartedAt >= SUPERCHARGE_COOLDOWN_TICKS
  );
}

function applySupercharge(target: Entity): void {
  target.addEffect("absorption", SUPERCHARGE_DURATION_TICKS, {
    showParticles: false,
  });
  target.addEffect("speed", SUPERCHARGE_DURATION_TICKS, {
    showParticles: false,
  });
  target.addEffect("regeneration", SUPERCHARGE_DURATION_TICKS, {
    showParticles: false,
  });
  target.addEffect("haste", SUPERCHARGE_DURATION_TICKS, {
    showParticles: false,
  });
  target.addEffect("strength", SUPERCHARGE_DURATION_TICKS, {
    showParticles: true,
  });
  target.addEffect("jump_boost", SUPERCHARGE_DURATION_TICKS, {
    showParticles: false,
  });
  target.dimension.playSound("item.armor.powerup", target.location);
}

function getHealthRatio(entity: Entity): number {
  const health = entity.getComponent(
    EntityComponentTypes.Health,
  ) as EntityHealthComponent;
  if (!health || health.effectiveMax <= 0) {
    return 1;
  }
  return health.currentValue / health.effectiveMax;
}
