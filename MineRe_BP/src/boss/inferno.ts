import {
  EntityLoadAfterEvent,
  Entity,
  world,
  system,
  EntitySpawnAfterEvent,
  EntityHurtAfterEvent,
  Vector3,
  EntityDamageCause,
  EffectType,
  EffectTypes,
  Player,
} from "@minecraft/server";
import { BOSS_TARGET_ID, GetBossTarget, SetBossTarget } from "./boss_utils";
import {
  addVector3,
  directionVector3,
  distVector3,
  getRandomAir,
  magnitudeVector3,
  multiplyVector3Number,
  randomVector3,
} from "util/vector3Functions";
import { isAlive } from "mob/mob_utils";
import { spawnParticleCloud } from "particles/particleCloud";

// ====== CONSTANTS & CONFIG ======
const INFERNO_TYPE_ID = "minere:inferno";
const BOSS_MODE_PROPERTY = "minere:phase";

const RUNNER_PROPERTY = "minere:inferno_runner";
const STRAFE_RUNNER_PROPERTY = "minere:strafe_runner";
const PHASE_RUNNER = "minere:phase_runner";
const RETREAT_RUNNER_ID = "minere:retreat_runner";

const RUNNER_TICK = 100;

const GUARD_MODE_TIMESTAMP = "minere:guard_timestamp";
const PUSH_MODE_TIMESTAMP = "minere:push_timestamp";
const STRAFE_COOLDOWN_TIMESTAMP = "minere:strafe_timestamp";
const TELEPORT_TIMESTAMP = "minere:teleport_timestamp";

const PUSH_COOLDOWN = 160;
const GUARD_COOLDOWN = 200;
const STRAFE_COOLDOWN = 120; // Cooldown after a strafe burst ends
const TELEPORT_COOLDOWN = 100; // ticks between teleports

const GUARD_DURATION = 100;
const STUN_DURATION = 160;
const STRAFE_DURATION = 80; // How long a strafe burst lasts
const STRAFE_FORCE = 0.02;

const MELEE_MAX_DISTANCE = 32;
const STOMP_MAX_DISTANCE = 16;
const PUSH_MAX_DISTANCE = 8;
const TELEPORT_CHANCE = 0.58;

enum InfernoMode {
  Ranged = 0,
  Melee = 1,
  Push = 2,
  Stomp = 3,
  Guard = 4,
  Stunned = 5,
}

type ModeEntry = {
  weight: number;
  mode: InfernoMode;
  action: (boss: Entity) => void;
};

// ====== CORE LOGIC ======

function setMode(
  boss: Entity,
  mode: InfernoMode,
  allowStunned: boolean = false,
) {
  if (boss.getProperty(BOSS_MODE_PROPERTY) === mode) return;
  if (
    !allowStunned &&
    boss.getProperty(BOSS_MODE_PROPERTY) === InfernoMode.Stunned
  ) {
    return;
  }

  const modeEvents: Record<number, string> = {
    [InfernoMode.Ranged]: "switch_to_ranged",
    [InfernoMode.Melee]: "switch_to_melee",
    [InfernoMode.Push]: "switch_to_push",
    [InfernoMode.Stomp]: "switch_to_stomp",
    [InfernoMode.Guard]: "switch_to_guard",
    [InfernoMode.Stunned]: "switch_to_stunned",
  };
  boss.clearVelocity();
  boss.triggerEvent(modeEvents[mode]);
}

function pickWeightedMode(modes: ModeEntry[], boss: Entity) {
  const currentMode = boss.getProperty(BOSS_MODE_PROPERTY);

  if (currentMode === InfernoMode.Stunned) return;

  const availableModes = modes.filter(
    (m) => m.mode !== currentMode && m.weight > 0,
  );

  if (availableModes.length === 0) return;

  const totalWeight = availableModes.reduce((sum, m) => sum + m.weight, 0);

  if (totalWeight <= 0) return;

  const roll = Math.random() * totalWeight;
  let cumulative = 0;

  for (const entry of availableModes) {
    cumulative += entry.weight;
    if (roll <= cumulative) {
      entry.action(boss);
      return;
    }
  }
}

// ====== MODE BEHAVIORS ======

function rangedMode(boss: Entity) {
  setMode(boss, InfernoMode.Ranged);
}

function meleeMode(boss: Entity) {
  const target = GetBossTarget(boss);
  if (
    !target ||
    distVector3(boss.location, target.location) > MELEE_MAX_DISTANCE
  ) {
    return rangedMode(boss);
  }
  setMode(boss, InfernoMode.Melee);
}

function stompMode(boss: Entity) {
  const target = GetBossTarget(boss);
  if (
    !target ||
    distVector3(boss.location, target.location) > STOMP_MAX_DISTANCE
  ) {
    return pickWeightedMode(MODE_WEIGHTS, boss);
  }
  setMode(boss, InfernoMode.Stomp);
}

function startPush(boss: Entity, allowStunned: boolean = false) {
  if (boss.getProperty(BOSS_MODE_PROPERTY) === InfernoMode.Push) return;
  if (
    !allowStunned &&
    boss.getProperty(BOSS_MODE_PROPERTY) === InfernoMode.Stunned
  ) {
    return;
  }

  const timestamp = boss.getDynamicProperty(PUSH_MODE_TIMESTAMP);
  if (
    typeof timestamp === "number" &&
    system.currentTick - timestamp < PUSH_COOLDOWN
  ) {
    return;
  }

  clearRun(boss, PHASE_RUNNER);
  setMode(boss, InfernoMode.Push);

  boss.setDynamicProperty(PUSH_MODE_TIMESTAMP, system.currentTick);
}

function guardMode(boss: Entity, allowStunned: boolean = false) {
  if (boss.getProperty(BOSS_MODE_PROPERTY) === InfernoMode.Guard) return;
  if (
    !allowStunned &&
    boss.getProperty(BOSS_MODE_PROPERTY) === InfernoMode.Stunned
  ) {
    return;
  }

  const target = GetBossTarget(boss);
  if (!target) return rangedMode(boss);

  const timestamp = boss.getDynamicProperty(GUARD_MODE_TIMESTAMP);
  if (
    typeof timestamp === "number" &&
    system.currentTick - timestamp < GUARD_COOLDOWN
  ) {
    return;
  }

  clearRun(boss, PHASE_RUNNER);
  setMode(boss, InfernoMode.Guard);

  boss.setDynamicProperty(GUARD_MODE_TIMESTAMP, system.currentTick);

  const guardRun = system.runTimeout(() => {
    rangedMode(boss);
  }, GUARD_DURATION);

  boss.setDynamicProperty(PHASE_RUNNER, guardRun);
}

function becomeStunned(boss: Entity) {
  if (boss.getProperty(BOSS_MODE_PROPERTY) === InfernoMode.Stunned) return;

  setMode(boss, InfernoMode.Stunned);
  clearRun(boss, PHASE_RUNNER);

  const stunRun = system.runTimeout(() => {
    const target = GetBossTarget(boss);
    if (!target) return rangedMode(boss);

    if (distVector3(target.location, boss.location) < PUSH_MAX_DISTANCE) {
      startPush(boss, true);
    } else {
      guardMode(boss, true);
    }
  }, STUN_DURATION);

  boss.setDynamicProperty(PHASE_RUNNER, stunRun);
}

const MODE_WEIGHTS: ModeEntry[] = [
  { weight: 35, mode: InfernoMode.Melee, action: meleeMode },
  { weight: 55, mode: InfernoMode.Ranged, action: rangedMode },
  { weight: 0, mode: InfernoMode.Stomp, action: stompMode },
];

// ====== STRAFE LOGIC ======

function startStrafeRunner(entity: Entity) {
  let strafeDir = Math.random() > 0.5 ? 1 : -1;

  clearRun(entity, STRAFE_RUNNER_PROPERTY);

  // Outer runner: checks every 20 ticks if a strafe burst should start
  const outerRunner = system.runInterval(() => {
    if (!entity.isValid || !isAlive(entity)) {
      system.clearRun(outerRunner);
      return;
    }

    const currentMode = entity.getProperty(BOSS_MODE_PROPERTY);
    if (currentMode !== InfernoMode.Ranged) return;

    const target = GetBossTarget(entity);
    if (!target || !isAlive(target)) return;

    const lastStrafe = entity.getDynamicProperty(STRAFE_COOLDOWN_TIMESTAMP);
    if (
      typeof lastStrafe === "number" &&
      system.currentTick - lastStrafe < STRAFE_COOLDOWN
    ) {
      return; // Still on cooldown
    }

    const innerRunner = system.runInterval(() => {
      // Stop conditions
      if (
        !entity.isValid ||
        !isAlive(entity) ||
        !target.isValid ||
        !isAlive(target) ||
        entity.getProperty(BOSS_MODE_PROPERTY) !== InfernoMode.Ranged
      ) {
        system.clearRun(innerRunner);
        return;
      }

      applyStrafe(entity, target, STRAFE_FORCE * strafeDir);

      // Occasionally flip direction
      if (Math.random() < 0.02) strafeDir *= -1;
    }, 1);

    // Closer timeout: ends the inner runner after STRAFE_DURATION
    system.runTimeout(() => {
      system.clearRun(innerRunner);
      entity.setDynamicProperty(STRAFE_COOLDOWN_TIMESTAMP, system.currentTick);
    }, STRAFE_DURATION);

    // Store inner runner for clearing if needed
    entity.setDynamicProperty(STRAFE_RUNNER_PROPERTY, innerRunner);
  }, 20);

  // Store outer runner
  entity.setDynamicProperty(STRAFE_RUNNER_PROPERTY, outerRunner);
}

// ====== LIFECYCLE / RUNNERS ======

function startRunner(entity: Entity) {
  if (!isAliveInferno(entity)) return;

  clearRun(entity, RUNNER_PROPERTY);
  clearRun(entity, STRAFE_RUNNER_PROPERTY);

  // Thinking Runner
  const runner = system.runInterval(() => {
    if (!entity.isValid || !isAlive(entity)) {
      system.clearRun(runner);
      return;
    }

    const currentMode = entity.getProperty(BOSS_MODE_PROPERTY);
    if (
      currentMode !== InfernoMode.Push &&
      currentMode !== InfernoMode.Guard &&
      currentMode !== InfernoMode.Stunned
    ) {
      pickWeightedMode(MODE_WEIGHTS, entity);
    }
  }, RUNNER_TICK);

  entity.setDynamicProperty(RUNNER_PROPERTY, runner);

  // Dedicated Movement Runner
  startStrafeRunner(entity);
}

// ====== EVENT LISTENERS ======

export function startInfernoRunners(entity: Entity) {
  if (isAliveInferno(entity)) startRunner(entity);
}

export function infernoOnHurtEntity(data: EntityHurtAfterEvent) {
  onInfernoHurt(data);
  onHurtByInferno(data);
}

function onInfernoHurt(data: EntityHurtAfterEvent) {
  if (!isAliveInferno(data?.hurtEntity)) {
    return;
  }

  const boss = data.hurtEntity;
  const projectile = data.damageSource?.damagingProjectile;
  const attacker = data.damageSource?.damagingEntity;

  if (data.damageSource.cause === EntityDamageCause.suffocation) {
    const targetPos = getRandomAir(boss.location, boss.dimension, 16, 10);
    teleportParticleLine(boss, targetPos, boss.location);
  }

  if (isAlive(attacker)) {
    const targetDistance = distVector3(boss.location, attacker.location);
    SetBossTarget(boss, attacker);
    if (targetDistance < PUSH_MAX_DISTANCE && Math.random() < 0.25) {
      return startPush(boss);
    }
    if (targetDistance < MELEE_MAX_DISTANCE && Math.random() < 0.25) {
      return meleeMode(boss);
    }
  }

  if (projectile) {
    if (projectile.typeId === "minere:ice_charge" && Math.random() < 0.33) {
      return becomeStunned(boss);
    } else if (projectile.typeId === "minere:blue_fireball") {
      return becomeStunned(boss);
    }
    if (Math.random() < 0.33) {
      return guardMode(boss);
    }
  }

  if (Math.random() <= TELEPORT_CHANCE) {
    system.runTimeout(() => {
      teleportToTarget(boss);
    }, Math.random() * 100);
  }
}

function onHurtByInferno(data: EntityHurtAfterEvent) {
  const boss = data.damageSource?.damagingEntity;
  if (!isAliveInferno(boss)) {
    return;
  }
  SetBossTarget(boss, data.hurtEntity);
  const target = GetBossTarget(boss);
  if (
    data.damageSource?.damagingProjectile?.typeId === "minere:blue_fireball"
  ) {
    if (!!target?.getEffect("fire_resistance")) {
      target.removeEffect("fire_resistance");
      if (target instanceof Player) {
        target.sendMessage({
          text: "Your fire resistance is gone!",
          translate: "warning.minere:blue_fireball",
        });
        spawnParticleCloud(
          "minere:skull_particles",
          target.location,
          2,
          20,
          target.dimension,
        );
      }
    }
  }
  if (boss.getProperty(BOSS_MODE_PROPERTY) === InfernoMode.Melee) {
    if (Math.random() <= 0.5) {
      clearRun(boss, RETREAT_RUNNER_ID);
      const retreatRunner = system.runInterval(() => {
        if (!isAlive(boss) || !isAlive(target)) {
          system.clearRun(retreatRunner);
          return;
        }
        if (boss.getProperty(BOSS_MODE_PROPERTY) !== InfernoMode.Melee) {
          system.clearRun(retreatRunner);
          return;
        }
        if (distVector3(boss.location, target.location) > 12) {
          system.clearRun(retreatRunner);
          return;
        }
        const dir = directionVector3(target.location, boss.location);
        if (magnitudeVector3(boss.getVelocity()) < 0.3) {
          boss.applyImpulse(multiplyVector3Number(dir, -0.8));
        }
      });
      system.runTimeout(() => {
        system.clearRun(retreatRunner);
      }, 60);
    }
  }
}

// ====== UTILS ======

function isAliveInferno(entity: Entity): boolean {
  return (
    !!entity &&
    entity.isValid &&
    entity.typeId === INFERNO_TYPE_ID &&
    isAlive(entity)
  );
}

function clearRun(boss: Entity, runPropertyName: string): boolean {
  try {
    const existing = boss.getDynamicProperty(runPropertyName);
    if (typeof existing === "number") {
      system.clearRun(existing);
      boss.setDynamicProperty(runPropertyName, undefined);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export function applyStrafe(
  entity: Entity,
  target: Entity,
  force: number,
): void {
  const loc = entity.location;
  const targetLoc = target.location;

  const dx = targetLoc.x - loc.x;
  const dz = targetLoc.z - loc.z;

  const distance = Math.sqrt(dx * dx + dz * dz);
  if (distance < 0.1) return;

  const forwardX = dx / distance;
  const forwardZ = dz / distance;

  const strafeX = -forwardZ;
  const strafeZ = forwardX;

  let yMod = 0;

  if (entity.location.y < target.location.y + 2) {
    yMod = 1;
  }
  if (entity.location.y > target.location.y + 5) {
    yMod = -1;
  }

  entity.applyImpulse({
    x: strafeX * force,
    y: 0,
    z: strafeZ * force,
  });
}

function teleportToTarget(boss: Entity) {
  if (!isAlive(boss)) return;
  if (boss.getProperty(BOSS_MODE_PROPERTY) === InfernoMode.Stunned) return;

  const target = GetBossTarget(boss);
  if (!isAlive(target)) return;

  // Teleport cooldown
  const TELEPORT_COOLDOWN = 200; // ticks, adjust as needed
  const lastTeleport = boss.getDynamicProperty("teleport_cooldown");
  if (
    typeof lastTeleport === "number" &&
    system.currentTick - lastTeleport < TELEPORT_COOLDOWN
  )
    return;

  let targetZone = target.location;

  // Clamp to 16 blocks toward the target
  const toTargetDir = directionVector3(boss.location, target.location);
  const distanceToTarget = distVector3(boss.location, target.location);
  if (distanceToTarget > 16) {
    targetZone = addVector3(
      boss.location,
      multiplyVector3Number(toTargetDir, 16),
    );
  }

  // Pick random nearby air
  for (let i = 0; i < 5; i++) {
    let candidate = getRandomAir(targetZone, boss.dimension, 4, 4); // smaller range to avoid sliding too far
    if (!candidate) {
      continue;
    }
    const distToTarget = distVector3(candidate, target.location);

    if (
      distToTarget < 6 ||
      distToTarget > 16 ||
      Math.abs(candidate.y - target.location.y) > 6 ||
      candidate.y < target.location.y
    ) {
      continue;
    }

    teleportParticleLine(boss, candidate, target.location);

    // Set teleport cooldown
    boss.setDynamicProperty("teleport_cooldown", system.currentTick);

    // Switch mode
    rangedMode(boss);
    return;
  }
}

function teleportParticleLine(
  boss: Entity,
  location: Vector3,
  faceLocation: Vector3,
) {
  if (!isAlive(boss)) {
    return;
  }
  const distance = distVector3(boss.location, location);
  const dir = directionVector3(location, boss.location);
  for (let i = 0; i <= distance; i++) {
    spawnParticleCloud(
      "minecraft:candle_flame_particle",
      addVector3(boss.location, multiplyVector3Number(dir, i)),
      2,
      10,
      boss.dimension,
    );
  }
  boss.teleport(location, { facingLocation: faceLocation });
}
