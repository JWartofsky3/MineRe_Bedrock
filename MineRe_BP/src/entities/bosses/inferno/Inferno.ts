import {
  Entity,
  EntityDamageCause,
  EntityHurtAfterEvent,
  EntitySpawnAfterEvent,
  system,
} from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { getHealth } from "entities/utilities/common";
import {
  addVector3,
  directionVector3,
  distVector3,
  getRandomAir,
  magnitudeVector3,
  multiplyVector3Number,
} from "util/vector3Functions";
import { spawnParticleCloud } from "particles/particleCloud";
import { ParticleWave, particleWave } from "particles/particleWave";

// Summary:
// Inferno is a boss entity that ticks every 16–24 ticks. It selects weighted modes
// based on distance and phase cycles, avoids stomp due to buggy behavior, and can
// push with a chance on being hurt. Push mode relies on behavior.json to return to
// ranged. Stun lasts for 8 cycles or 40 damage.
// Ranged mode strafes, and teleporting is allowed in melee, guard, and ranged modes.

const INFERNO_TYPE_ID = "minere:inferno";

const MODE_PROPERTY = "minere:phase";
const DYNAMIC_PROPERTIES = {
  PHASE_CYCLE: "minere:inferno_phase_cycle",
  STUN_DAMAGE: "minere:inferno_stun_damage",
  STUN_CYCLE: "minere:inferno_stun_cycle",
  CYCLE_COUNTER: "minere:inferno_cycle_counter",
  LAST_TELEPORT_CYCLE: "minere:inferno_last_teleport_cycle",
  LAST_PUSH_CYCLE: "minere:inferno_last_push_cycle",
  STRAFE_RUNNER: "minere:inferno_strafe_runner",
  RETREAT_RUNNER: "minere:inferno_retreat_runner",
  ORIGIN_POS: "minere:inferno_origin",
};

const TICK_INTERVAL: [number, number] = [16, 24];
const STUN_PROPERTIES = {
  DAMAGE_THRESHOLD: 50,
};

const TELEPORT_PROPERTIES = {
  MAX_DISTANCE: 32,
  MAX_DISTANCE_TO_TARGET: 25,
  MIN_DISTANCE_TO_TARGET: 8,
  VERTICAL_RANGE: 6,
  COOLDOWN: 7,
  MAX_ORIGIN_DISTANCE: 64,
  TELEPORT_CHANCE_MIN: 0.2,
  TELEPORT_CHANCE_MAX: 0.45,
  LOW_HEALTH_DISTANCE_BONUS: 8,
  // effects
  PARTICLE_ID: "minecraft:candle_flame_particle",
  SOUND_ID: "mob.ghast.fireball",
  SOUND_VOLUME: 0.5,
};

const SOUND_PROPERTIES = {
  PHASE_CHANGE_ID: "boss.inferno.hydraulic",
  PUSH_ID: "mob.breeze.shoot",
};

const MOVEMENT_PROPERTIES = {
  STRAFE_FORCE: 0.08,
  STRAFE_TICKS: 12,
  RETREAT_DISTANCE: 12,
  RETREAT_FORCE: 0.8,
  RETREAT_TICKS: 60,
  MAX_VELOCITY: 0.5,
};

const COMBAT_PROPERTIES = {
  MELEE_RANGE: 16,
  PUSH_RANGE: 8,
  PUSH_COOLDOWN: 8,
  GUARD_RANGE: 24,
  PUSH_CHANCE_MIN: 0.12,
  PUSH_CHANCE_MAX: 0.35,
  PUSH_DELAY: 20,
};

const TARGET_FAMILIES = ["player", "villager", "irongolem"];

enum InfernoMode {
  Ranged = 0,
  Melee = 1,
  Push = 2,
  Stomp = 3,
  Guard = 4,
  Stunned = 5,
}

const PHASE_CYCLE_LIMITS: Record<InfernoMode, number> = {
  [InfernoMode.Ranged]: 8,
  [InfernoMode.Melee]: 6,
  [InfernoMode.Push]: -1,
  [InfernoMode.Stomp]: 5,
  [InfernoMode.Guard]: 4,
  [InfernoMode.Stunned]: 8,
};

const MODE_WEIGHTS: Record<InfernoMode, number>[] = [
  {
    [InfernoMode.Ranged]: 3,
    [InfernoMode.Melee]: 5,
    [InfernoMode.Push]: 2,
    [InfernoMode.Stomp]: 3,
    [InfernoMode.Guard]: 0,
    [InfernoMode.Stunned]: 0,
  },
  {
    [InfernoMode.Ranged]: 6,
    [InfernoMode.Melee]: 5,
    [InfernoMode.Push]: 0,
    [InfernoMode.Stomp]: 1,
    [InfernoMode.Guard]: 2,
    [InfernoMode.Stunned]: 0,
  },
  {
    [InfernoMode.Ranged]: 6,
    [InfernoMode.Melee]: 2,
    [InfernoMode.Push]: 0,
    [InfernoMode.Stomp]: 0,
    [InfernoMode.Guard]: 2,
    [InfernoMode.Stunned]: 0,
  },
  {
    [InfernoMode.Ranged]: 4,
    [InfernoMode.Melee]: 0,
    [InfernoMode.Push]: 0,
    [InfernoMode.Stomp]: 0,
    [InfernoMode.Guard]: 1,
    [InfernoMode.Stunned]: 0,
  },
];

export class Inferno extends BaseCustomEntity {
  constructor() {
    super(INFERNO_TYPE_ID, {
      tick: TICK_INTERVAL,
      targetQuery: { families: TARGET_FAMILIES, maxDistance: 48 },
    });
  }

  // Initialize state on spawn.
  onEntitySpawn = (data: EntitySpawnAfterEvent): void => {
    const entity = data.entity;
    if (!entity?.isValid) {
      return;
    }
    this.setMode(entity, InfernoMode.Ranged);
    entity.setDynamicProperty(DYNAMIC_PROPERTIES.PHASE_CYCLE, 0);
    entity.setDynamicProperty(DYNAMIC_PROPERTIES.STUN_DAMAGE, 0);
    entity.setDynamicProperty(DYNAMIC_PROPERTIES.STUN_CYCLE, 0);
    entity.setDynamicProperty(DYNAMIC_PROPERTIES.CYCLE_COUNTER, 0);
    entity.setDynamicProperty(
      DYNAMIC_PROPERTIES.LAST_TELEPORT_CYCLE,
      -TELEPORT_PROPERTIES.COOLDOWN,
    );
    entity.setDynamicProperty(
      DYNAMIC_PROPERTIES.LAST_PUSH_CYCLE,
      -COMBAT_PROPERTIES.PUSH_COOLDOWN,
    );
    entity.setDynamicProperty(DYNAMIC_PROPERTIES.ORIGIN_POS, {
      x: entity.location.x,
      y: entity.location.y,
      z: entity.location.z,
    });
  };

  // React to incoming damage (targeting, stun, push chance).
  onEntityHurt = (data: EntityHurtAfterEvent): void => {
    const boss = data.hurtEntity;
    if (!boss?.isValid) {
      return;
    }
    const attacker = data.damageSource?.damagingEntity;

    const mode = this.getMode(boss);
    if (mode === InfernoMode.Stunned) {
      const current = boss.getDynamicProperty(DYNAMIC_PROPERTIES.STUN_DAMAGE);
      const currentValue = typeof current === "number" ? current : 0;
      boss.setDynamicProperty(
        DYNAMIC_PROPERTIES.STUN_DAMAGE,
        currentValue + data.damage,
      );
      return;
    }

    const projectile = data.damageSource?.damagingProjectile;
    const projectileId = projectile?.typeId;
    if (
      (projectileId === "minere:ice_charge" && Math.random() < 0.33) ||
      projectileId === "minere:blue_fireball" ||
      projectileId === "minere:ice_bomb" ||
      attacker?.typeId === "minere:ice_bomb"
    ) {
      this.enterStunned(boss);
      return;
    }

    if (attacker?.isValid) {
      const distance = distVector3(boss.location, attacker.location);
      if (
        distance <= COMBAT_PROPERTIES.PUSH_RANGE &&
        this.canEnterPush(boss) &&
        Math.random() < this.getPushChanceOnHurt(boss)
      ) {
        this.enterPush(boss);
      }
    }
  };

  // Retreat when the boss lands a melee hit.
  onEntityHurtEntity = (data: EntityHurtAfterEvent): void => {
    const boss = data.damageSource?.damagingEntity;
    const target = data.hurtEntity;
    if (!boss?.isValid || !target?.isValid) {
      return;
    }
    if (data.damageSource?.cause !== EntityDamageCause.entityAttack) {
      return;
    }
    if (this.getMode(boss) !== InfernoMode.Melee) {
      return;
    }
    this.retreat(boss, target);
  };

  // Main AI tick: target selection, phase cycles, movement behaviors.
  onTick = (boss: Entity): void => {
    if (!boss?.isValid) {
      return;
    }

    this.incrementCycleCounter(boss);

    const target = this.getTarget(boss);

    const mode = this.getMode(boss);
    if (mode === InfernoMode.Stunned) {
      this.handleStunned(boss);
      return;
    }

    if (mode !== InfernoMode.Push) {
      this.incrementPhaseCycle(boss);
    }
    if (this.shouldChangePhase(boss)) {
      this.changePhase(boss, target);
    }

    if (mode === InfernoMode.Ranged && target?.isValid) {
      this.strafe(boss, target);
    }

    if (target?.isValid && Math.random() < this.getTeleportChance(boss)) {
      this.tryTeleport(boss, target);
    }
  };

  // Read the current phase/mode from the entity property.
  private getMode(entity: Entity): InfernoMode {
    const value = entity.getProperty(MODE_PROPERTY);
    if (typeof value === "number") {
      return value as InfernoMode;
    }
    return InfernoMode.Ranged;
  }

  // Set phase/mode and trigger the corresponding behavior event.
  private setMode(entity: Entity, mode: InfernoMode): void {
    const current = this.getMode(entity);
    if (current === mode) {
      return;
    }

    // if (mode === InfernoMode.Stomp) {
    //   return;
    // }

    this.killMovement(entity);
    entity.setProperty(MODE_PROPERTY, mode);
    entity.dimension.playSound(
      SOUND_PROPERTIES.PHASE_CHANGE_ID,
      entity.location,
    );
    entity.clearVelocity();
    entity.teleport(entity.location, { keepVelocity: false });

    const modeEvents: Record<number, string> = {
      [InfernoMode.Ranged]: "switch_to_ranged",
      [InfernoMode.Melee]: "switch_to_melee",
      [InfernoMode.Push]: "switch_to_push",
      [InfernoMode.Stomp]: "switch_to_stomp",
      [InfernoMode.Guard]: "switch_to_guard",
      [InfernoMode.Stunned]: "switch_to_stunned",
    };

    const eventId = modeEvents[mode];
    if (eventId) {
      entity.triggerEvent(eventId);
    }
  }

  // Increment the phase cycle counter.
  private incrementPhaseCycle(entity: Entity): void {
    const current = entity.getDynamicProperty(DYNAMIC_PROPERTIES.PHASE_CYCLE);
    const value = typeof current === "number" ? current : 0;
    entity.setDynamicProperty(DYNAMIC_PROPERTIES.PHASE_CYCLE, value + 1);
  }

  // Increment the global cycle counter for cooldown tracking.
  private incrementCycleCounter(entity: Entity): void {
    const current = entity.getDynamicProperty(DYNAMIC_PROPERTIES.CYCLE_COUNTER);
    const value = typeof current === "number" ? current : 0;
    entity.setDynamicProperty(DYNAMIC_PROPERTIES.CYCLE_COUNTER, value + 1);
  }

  // Check if phase cycle threshold is met.
  private shouldChangePhase(entity: Entity): boolean {
    const current = entity.getDynamicProperty(DYNAMIC_PROPERTIES.PHASE_CYCLE);
    const value = typeof current === "number" ? current : 0;
    const mode = this.getMode(entity);
    const cycleLimit = this.getPhaseCycleLimit(mode);
    if (cycleLimit < 0) {
      return false;
    }
    return value >= cycleLimit;
  }

  private getPhaseCycleLimit(mode: InfernoMode): number {
    return PHASE_CYCLE_LIMITS[mode] ?? PHASE_CYCLE_LIMITS[InfernoMode.Ranged];
  }

  // Reset the phase cycle counter.
  private resetPhaseCycle(entity: Entity): void {
    entity.setDynamicProperty(DYNAMIC_PROPERTIES.PHASE_CYCLE, 0);
  }

  // Choose the next phase using weighted random decisions.
  private changePhase(entity: Entity, target: Entity | null): void {
    this.resetPhaseCycle(entity);

    const currentMode = this.getMode(entity);
    const distance = target?.isValid
      ? distVector3(entity.location, target.location)
      : Number.POSITIVE_INFINITY;

    const weights = this.getModeWeights(distance, currentMode);
    const nextMode = this.pickWeightedMode(weights);
    if (nextMode === InfernoMode.Stomp) {
      return;
    }
    this.setMode(entity, nextMode);
  }

  // Handle stunned duration and exit conditions.
  private handleStunned(entity: Entity): void {
    const cycles = entity.getDynamicProperty(DYNAMIC_PROPERTIES.STUN_CYCLE);
    const cycleValue = typeof cycles === "number" ? cycles : 0;
    const damage = entity.getDynamicProperty(DYNAMIC_PROPERTIES.STUN_DAMAGE);
    const damageValue = typeof damage === "number" ? damage : 0;

    if (
      damageValue >= STUN_PROPERTIES.DAMAGE_THRESHOLD ||
      cycleValue >= this.getPhaseCycleLimit(InfernoMode.Stunned)
    ) {
      entity.setDynamicProperty(DYNAMIC_PROPERTIES.PHASE_CYCLE, 0);
      entity.setDynamicProperty(DYNAMIC_PROPERTIES.STUN_DAMAGE, 0);
      entity.setDynamicProperty(DYNAMIC_PROPERTIES.STUN_CYCLE, 0);
      this.setMode(entity, InfernoMode.Ranged);
      return;
    }

    entity.setDynamicProperty(DYNAMIC_PROPERTIES.STUN_CYCLE, cycleValue + 1);
  }

  // Enter stun and reset related counters.
  private enterStunned(entity: Entity): void {
    entity.setDynamicProperty(DYNAMIC_PROPERTIES.PHASE_CYCLE, 0);
    entity.setDynamicProperty(DYNAMIC_PROPERTIES.STUN_DAMAGE, 0);
    entity.setDynamicProperty(DYNAMIC_PROPERTIES.STUN_CYCLE, 0);
    this.setMode(entity, InfernoMode.Stunned);
  }

  // Enter push and play the delayed push sound if still pushing.
  private enterPush(entity: Entity): void {
    this.markPushCycle(entity);
    this.setMode(entity, InfernoMode.Push);
    this.killMovement(entity);
    system.runTimeout(() => {
      if (!entity?.isValid) {
        return;
      }
      if (this.getMode(entity) !== InfernoMode.Push) {
        return;
      }
      this.killMovement(entity);
      entity.dimension.playSound(SOUND_PROPERTIES.PUSH_ID, entity.location);
    }, COMBAT_PROPERTIES.PUSH_DELAY);
  }

  private canEnterPush(entity: Entity): boolean {
    const currentCycle = entity.getDynamicProperty(
      DYNAMIC_PROPERTIES.CYCLE_COUNTER,
    );
    const lastPushCycle = entity.getDynamicProperty(
      DYNAMIC_PROPERTIES.LAST_PUSH_CYCLE,
    );
    const currentValue = typeof currentCycle === "number" ? currentCycle : 0;
    const lastValue = typeof lastPushCycle === "number" ? lastPushCycle : 0;
    return currentValue - lastValue >= COMBAT_PROPERTIES.PUSH_COOLDOWN;
  }

  private markPushCycle(entity: Entity): void {
    const currentCycle = entity.getDynamicProperty(
      DYNAMIC_PROPERTIES.CYCLE_COUNTER,
    );
    const currentValue = typeof currentCycle === "number" ? currentCycle : 0;
    entity.setDynamicProperty(DYNAMIC_PROPERTIES.LAST_PUSH_CYCLE, currentValue);
  }

  // Compute weighted mode chances based on distance.
  private getModeWeights(
    distance: number,
    currentMode: InfernoMode,
  ): Record<InfernoMode, number> {
    const weights =
      MODE_WEIGHTS[Math.min(Math.floor(distance / 8), MODE_WEIGHTS.length - 1)];

    // reduce weight for current mode to make it less likely to be picked again
    weights[currentMode] = weights[currentMode] * 0.5;

    return weights;
  }

  // Pick a mode from the provided weights.
  private pickWeightedMode(weights: Record<InfernoMode, number>): InfernoMode {
    const entries = Object.entries(weights).filter(
      ([modeKey, weight]) => weight > 0,
    );
    let total = 0;
    for (const [, weight] of entries) {
      total += weight;
    }
    let roll = Math.random() * total;
    for (const [modeKey, weight] of entries) {
      roll -= weight;
      if (roll <= 0) {
        return Number(modeKey) as InfernoMode;
      }
    }
    return InfernoMode.Ranged;
  }

  // Apply strafing impulse around the target.
  private strafe(entity: Entity, target: Entity): void {
    const existing = entity.getDynamicProperty(
      DYNAMIC_PROPERTIES.STRAFE_RUNNER,
    );
    if (typeof existing === "number") {
      return;
    }
    const dir = directionVector3(target.location, entity.location);
    const yDir =
      entity.location.y > target.location.y + 2
        ? -0.1
        : entity.location.y < target.location.y + 1
          ? 0.1
          : 0;
    const strafeDir = Math.random() < 0.5 ? 1 : -1;
    const strafe = { x: -dir.z * strafeDir, y: 0, z: dir.x * strafeDir };
    let ticks = 0;
    const runner = system.runInterval(() => {
      if (!entity?.isValid || !target?.isValid) {
        system.clearRun(runner);
        entity.setDynamicProperty(DYNAMIC_PROPERTIES.STRAFE_RUNNER, undefined);
        return;
      }
      if (this.getMode(entity) !== InfernoMode.Ranged) {
        system.clearRun(runner);
        entity.setDynamicProperty(DYNAMIC_PROPERTIES.STRAFE_RUNNER, undefined);
        return;
      }
      entity.applyImpulse(
        multiplyVector3Number(strafe, MOVEMENT_PROPERTIES.STRAFE_FORCE),
      );
      ticks += 1;
      if (ticks >= MOVEMENT_PROPERTIES.STRAFE_TICKS) {
        system.clearRun(runner);
        entity.setDynamicProperty(DYNAMIC_PROPERTIES.STRAFE_RUNNER, undefined);
      }
    }, 1);
    entity.setDynamicProperty(DYNAMIC_PROPERTIES.STRAFE_RUNNER, runner);
  }

  // Teleport near the target within distance and vertical limits.
  private tryTeleport(entity: Entity, target: Entity): void {
    if (!target?.isValid) {
      return;
    }
    if (!this.canTeleport(entity)) {
      return;
    }

    const origin = target.location;
    const distanceBonus = this.getTeleportDistanceBonus(entity);
    const minTeleportDistance =
      TELEPORT_PROPERTIES.MIN_DISTANCE_TO_TARGET + distanceBonus;
    const maxTeleportDistance =
      TELEPORT_PROPERTIES.MAX_DISTANCE_TO_TARGET + distanceBonus;
    const randomOffset = Math.ceil(maxTeleportDistance);
    for (let i = 0; i < 6; i++) {
      const candidate = getRandomAir(origin, entity.dimension, randomOffset, 6);
      if (!candidate) {
        continue;
      }
      const distance = distVector3(candidate, origin);
      const vertical = Math.abs(candidate.y - origin.y);
      if (distance < minTeleportDistance || distance > maxTeleportDistance) {
        continue;
      }
      if (vertical > TELEPORT_PROPERTIES.VERTICAL_RANGE) {
        continue;
      }
      if (!this.isWithinTeleportRange(entity, candidate)) {
        continue;
      }
      this.teleportWithEffects(entity, candidate, origin);
      this.markTeleported(entity);
      return;
    }
  }

  // Check teleport cooldown based on cycle count.
  private canTeleport(entity: Entity): boolean {
    const mode = this.getMode(entity);
    if (mode === InfernoMode.Push || mode === InfernoMode.Stunned) {
      return false;
    }

    if (entity.isInWater) {
      return true;
    }

    const currentCycle = entity.getDynamicProperty(
      DYNAMIC_PROPERTIES.CYCLE_COUNTER,
    );
    const lastCycle = entity.getDynamicProperty(
      DYNAMIC_PROPERTIES.LAST_TELEPORT_CYCLE,
    );
    const currentValue = typeof currentCycle === "number" ? currentCycle : 0;
    const lastValue = typeof lastCycle === "number" ? lastCycle : 0;
    return currentValue - lastValue >= TELEPORT_PROPERTIES.COOLDOWN;
  }

  // Record the cycle when a teleport occurs.
  private markTeleported(entity: Entity): void {
    const currentCycle = entity.getDynamicProperty(
      DYNAMIC_PROPERTIES.CYCLE_COUNTER,
    );
    const currentValue = typeof currentCycle === "number" ? currentCycle : 0;
    entity.setDynamicProperty(
      DYNAMIC_PROPERTIES.LAST_TELEPORT_CYCLE,
      currentValue,
    );
  }

  // Ensure teleport destination is within the origin radius.
  private isWithinTeleportRange(
    entity: Entity,
    destination: { x: number; y: number; z: number },
  ): boolean {
    const origin = entity.getDynamicProperty(DYNAMIC_PROPERTIES.ORIGIN_POS) as {
      x: number;
      y: number;
      z: number;
    };
    if (
      origin &&
      distVector3(origin, destination) > TELEPORT_PROPERTIES.MAX_ORIGIN_DISTANCE
    ) {
      return false;
    }
    if (
      distVector3(entity.location, destination) >
      TELEPORT_PROPERTIES.MAX_DISTANCE
    ) {
      return false;
    }
    return true;
  }

  // Teleport with particle trail and sound.
  private teleportWithEffects(
    entity: Entity,
    destination: { x: number; y: number; z: number },
    faceLocation: { x: number; y: number; z: number },
  ): void {
    const dimension = entity.dimension;

    particleWave({
      startLocation: entity.location,
      endLocation: destination,
      dimension: entity.dimension,
      particle: TELEPORT_PROPERTIES.PARTICLE_ID,
      soundEffect: TELEPORT_PROPERTIES.SOUND_ID,
      soundOptions: { volume: TELEPORT_PROPERTIES.SOUND_VOLUME },
      ticksPerStep: 0,
      particleCloudOptions: {
        distance: 2,
        count: 10,
      },
    });

    entity.teleport(destination, {
      facingLocation: faceLocation,
      keepVelocity: false,
    });
    entity.clearVelocity();
  }

  // Retreat away from the target after a melee hit.
  private retreat(entity: Entity, target: Entity): void {
    const existing = entity.getDynamicProperty(
      DYNAMIC_PROPERTIES.RETREAT_RUNNER,
    );
    if (typeof existing === "number") {
      return;
    }

    const dir = directionVector3(target.location, entity.location);
    let ticks = 0;
    const runner = system.runInterval(() => {
      if (!entity?.isValid || !target?.isValid) {
        system.clearRun(runner);
        entity.setDynamicProperty(DYNAMIC_PROPERTIES.RETREAT_RUNNER, undefined);
        return;
      }
      if (this.getMode(entity) !== InfernoMode.Melee) {
        system.clearRun(runner);
        entity.setDynamicProperty(DYNAMIC_PROPERTIES.RETREAT_RUNNER, undefined);
        return;
      }
      const distance = distVector3(entity.location, target.location);
      if (distance >= MOVEMENT_PROPERTIES.RETREAT_DISTANCE) {
        system.clearRun(runner);
        entity.setDynamicProperty(DYNAMIC_PROPERTIES.RETREAT_RUNNER, undefined);
        return;
      }
      const impulse = multiplyVector3Number(
        dir,
        -MOVEMENT_PROPERTIES.RETREAT_FORCE,
      );
      impulse.y = 0.1;
      if (
        magnitudeVector3(entity.getVelocity()) <
        MOVEMENT_PROPERTIES.MAX_VELOCITY
      ) {
        entity.applyImpulse(impulse);
      }
      ticks += 1;
      if (ticks >= MOVEMENT_PROPERTIES.RETREAT_TICKS) {
        system.clearRun(runner);
        entity.setDynamicProperty(DYNAMIC_PROPERTIES.RETREAT_RUNNER, undefined);
      }
    }, 1);
    entity.setDynamicProperty(DYNAMIC_PROPERTIES.RETREAT_RUNNER, runner);
  }

  private killMovement(entity: Entity): void {
    const strafeRunner = entity.getDynamicProperty(
      DYNAMIC_PROPERTIES.STRAFE_RUNNER,
    );
    if (typeof strafeRunner === "number") {
      system.clearRun(strafeRunner);
      entity.setDynamicProperty(DYNAMIC_PROPERTIES.STRAFE_RUNNER, undefined);
    }

    const retreatRunner = entity.getDynamicProperty(
      DYNAMIC_PROPERTIES.RETREAT_RUNNER,
    );
    if (typeof retreatRunner === "number") {
      system.clearRun(retreatRunner);
      entity.setDynamicProperty(DYNAMIC_PROPERTIES.RETREAT_RUNNER, undefined);
    }

    entity.clearVelocity();
  }

  private getPushChanceOnHurt(entity: Entity): number {
    return this.scaleByLowHealth(
      entity,
      COMBAT_PROPERTIES.PUSH_CHANCE_MIN,
      COMBAT_PROPERTIES.PUSH_CHANCE_MAX,
    );
  }

  private getTeleportChance(entity: Entity): number {
    return this.scaleByLowHealth(
      entity,
      TELEPORT_PROPERTIES.TELEPORT_CHANCE_MIN,
      TELEPORT_PROPERTIES.TELEPORT_CHANCE_MAX,
    );
  }

  private getTeleportDistanceBonus(entity: Entity): number {
    return (
      this.getLowHealthFactor(entity) *
      TELEPORT_PROPERTIES.LOW_HEALTH_DISTANCE_BONUS
    );
  }

  private scaleByLowHealth(entity: Entity, min: number, max: number): number {
    const lowHealthFactor = this.getLowHealthFactor(entity);
    return min + (max - min) * lowHealthFactor;
  }

  private getLowHealthFactor(entity: Entity): number {
    const health = getHealth(entity);
    if (!health) {
      return 0;
    }
    const maxHealth = health.effectiveMax;
    if (maxHealth <= 0) {
      return 0;
    }
    const healthRatio = health.currentValue / maxHealth;
    if (healthRatio <= 0) {
      return 1;
    }
    if (healthRatio >= 1) {
      return 0;
    }
    return 1 - healthRatio;
  }
}
