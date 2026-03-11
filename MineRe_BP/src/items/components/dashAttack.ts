import {
  Entity,
  EntityDamageCause,
  ItemComponentUseEvent,
  ItemComponentTypes,
  ItemCooldownComponent,
  system,
} from "@minecraft/server";
import { isAlive } from "entities/utilities/common";
import { spawnParticleCloud } from "particles/particleCloud";
import { reduceDurability } from "./reduce_durability";

type DashAttackOptions = {
  particle: string;
  soundId: string;
  soundVolume?: number;
  soundPitch?: number;
  waveSoundId?: string;
  waveSoundVolume?: number;
  waveSoundPitch?: number;
  damage: number;
  force?: number;
  upwardForce?: number;
  damageRadius?: number;
  dashTicks?: number;
  cloudDistance?: number;
  cloudCount?: number;
  durabilityCost?: number;
  onHit?: (entity: Entity) => void;
};

const DEFAULT_FORCE = 1.1;
const DEFAULT_UPWARD_FORCE = 0.08;
const DEFAULT_DAMAGE_RADIUS = 1.5;
const DEFAULT_DASH_TICKS = 6;
const DASH_RESISTANCE_AMPLIFIER = 2;

export function dashAttack(
  arg: ItemComponentUseEvent,
  options: DashAttackOptions,
) {
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

  const dimension = source.dimension;
  const direction = source.getViewDirection();
  const start = source.location;
  const touchedEntities = new Set<string>();

  if ((options.durabilityCost ?? 0) > 0) {
    reduceDurability(source, arg.itemStack, options.durabilityCost);
  }

  dimension.playSound(options.soundId, start, {
    volume: options.soundVolume ?? 1.0,
    pitch: options.soundPitch ?? 1.0,
  });

  source.applyImpulse({
    x: direction.x * (options.force ?? DEFAULT_FORCE),
    y: Math.max(
      options.upwardForce ?? DEFAULT_UPWARD_FORCE,
      direction.y * (options.force ?? DEFAULT_FORCE),
    ),
    z: direction.z * (options.force ?? DEFAULT_FORCE),
  });
  const dashTicks = Math.max(options.dashTicks ?? DEFAULT_DASH_TICKS, 1);
  source.addEffect("resistance", dashTicks * 1.5, {
    amplifier: DASH_RESISTANCE_AMPLIFIER,
    showParticles: false,
  });
  let currentTick = 0;
  const runner = system.runInterval(() => {
    if (!source?.isValid) {
      system.clearRun(runner);
      return;
    }

    spawnParticleCloud(
      options.particle,
      source.location,
      options.cloudDistance ?? 0.35,
      options.cloudCount ?? 2,
      dimension,
    );

    if (options.waveSoundId) {
      dimension.playSound(options.waveSoundId, source.location, {
        volume: options.waveSoundVolume ?? 1.0,
        pitch: options.waveSoundVolume ?? 1.0,
      });
    }

    const entities = dimension.getEntities({
      location: source.location,
      maxDistance: options.damageRadius ?? DEFAULT_DAMAGE_RADIUS,
    });
    for (const entity of entities) {
      if (entity.id === source.id || touchedEntities.has(entity.id)) {
        continue;
      }
      if (!isAlive(entity)) {
        continue;
      }
      touchedEntities.add(entity.id);
      entity.applyDamage(options.damage, {
        cause: EntityDamageCause.entityAttack,
        damagingEntity: source,
      });
      if (options.onHit) {
        options.onHit(entity);
      }
    }

    currentTick++;
    if (currentTick >= dashTicks) {
      system.clearRun(runner);
    }
  }, 1);
}
