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
const STUN_DAMAGE_PROPERTY = "minere:stun_damage";

const INFERNO_RUNNER = "minere:inferno_runner";
const PHASE_RUNNER = "minere:phase_runner";
const RETREAT_RUNNER = "minere:retreat_runner";

const RUNNER_TICK = 100;

const GUARD_MODE_TIMESTAMP = "minere:guard_timestamp";
const PUSH_MODE_TIMESTAMP = "minere:push_timestamp";
const STRAFE_COOLDOWN_TIMESTAMP = "minere:strafe_timestamp";
const TELEPORT_TIMESTAMP = "minere:teleport_timestamp";

const PUSH_COOLDOWN = 160;
const GUARD_COOLDOWN = 200;
const STRAFE_COOLDOWN = 120; // Cooldown after a strafe burst ends
const TELEPORT_COOLDOWN = 10; // ticks between teleports

const GUARD_DURATION = 100;
const STUN_DURATION = 160;
const STRAFE_DURATION = 80; // How long a strafe burst lasts
const STRAFE_FORCE = 0.02;
const MAX_STUN_DAMAGE = 30;

const MELEE_MAX_DISTANCE = 32;
const STOMP_MAX_DISTANCE = 16;
const PUSH_MAX_DISTANCE = 8;
const TELEPORT_CHANCE = 0.5;

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
  allowOverrideStunned: boolean = false,
) {
  const currentMode = boss.getProperty(BOSS_MODE_PROPERTY);

  if (currentMode === mode) return;

  // 🔒 PUSH LOCK
  // Cannot exit Push unless going to Stunned
  if (currentMode === InfernoMode.Push && mode !== InfernoMode.Stunned) {
    return;
  }

  // 🔒 STUN LOCK
  // Cannot exit Stunned unless explicitly allowed
  if (currentMode === InfernoMode.Stunned && !allowOverrideStunned) {
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

  clearRun(boss, PHASE_RUNNER);
  clearRun(boss, RETREAT_RUNNER);
  clearRun(boss, STRAFE_INNER_RUNNER);
  boss.dimension.playSound("boss.inferno.hydraulic", boss.location);
  boss.clearVelocity();
  boss.teleport(boss.location, {keepVelocity: false});
  boss.triggerEvent(modeEvents[mode]);
}

function pickWeightedMode(
  modes: ModeEntry[],
  boss: Entity,
  allowStunned: boolean = false,
  allowGuard: boolean = false,
) {
  const currentMode = boss.getProperty(BOSS_MODE_PROPERTY);

  if (currentMode === InfernoMode.Stunned && !allowStunned) return;
  if (currentMode === InfernoMode.Guard && !allowGuard) return;

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

function rangedMode(boss: Entity, allowOverrideStunned: boolean = false) {
  setMode(boss, InfernoMode.Ranged, allowOverrideStunned);
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

function startPush(boss: Entity, allowOverrideStunned: boolean = false) {
  if (boss.getProperty(BOSS_MODE_PROPERTY) === InfernoMode.Push) return;

  const timestamp = boss.getDynamicProperty(PUSH_MODE_TIMESTAMP);
  if (
    typeof timestamp === "number" &&
    system.currentTick - timestamp < PUSH_COOLDOWN
  ) {
    return;
  }

  clearRun(boss, PHASE_RUNNER);
  setMode(boss, InfernoMode.Push, allowOverrideStunned);

  //playsound, keep in sync with inferno.behavior.json
  system.runTimeout(() => {
    if (
      isAlive(boss) &&
      boss.getProperty(BOSS_MODE_PROPERTY) === InfernoMode.Push
    ) {
      boss.dimension.playSound("mob.breeze.shoot", boss.location);
    }
    boss.clearVelocity();
  }, 20);

  boss.setDynamicProperty(PUSH_MODE_TIMESTAMP, system.currentTick);
}

function guardMode(boss: Entity, allowOverrideStunned: boolean = false) {
  if (boss.getProperty(BOSS_MODE_PROPERTY) === InfernoMode.Guard) return;

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
  setMode(boss, InfernoMode.Guard, allowOverrideStunned);

  boss.setDynamicProperty(GUARD_MODE_TIMESTAMP, system.currentTick);

  const guardRun = system.runTimeout(() => {
    pickWeightedMode(MODE_WEIGHTS, boss);
  }, GUARD_DURATION);

  boss.setDynamicProperty(PHASE_RUNNER, guardRun);
}

function becomeStunned(boss: Entity) {
  if (boss.getProperty(BOSS_MODE_PROPERTY) === InfernoMode.Stunned) return;
  
  boss.dimension.playSound("mob.blaze.death", boss.location, {pitch: 0.5})
  setMode(boss, InfernoMode.Stunned, true);
  clearRun(boss, PHASE_RUNNER);

  system.runTimeout(() => {
    exitStun(boss);
  }, STUN_DURATION);
}

function exitStun(boss: Entity) {
    const target = GetBossTarget(boss);
    boss.setDynamicProperty(STUN_DAMAGE_PROPERTY, 0);
    if (!target) return rangedMode(boss, true);

    if (distVector3(target.location, boss.location) < PUSH_MAX_DISTANCE) {
      startPush(boss, true);
    } else {
      guardMode(boss, true);
    }
}

const MODE_WEIGHTS: ModeEntry[] = [
  { weight: 35, mode: InfernoMode.Melee, action: meleeMode },
  { weight: 55, mode: InfernoMode.Ranged, action: rangedMode },
  { weight: 0, mode: InfernoMode.Stomp, action: stompMode },
];

// ====== STRAFE LOGIC ======

const STRAFE_OUTER_RUNNER = "minere:strafe_outer";
const STRAFE_INNER_RUNNER = "minere:strafe_inner";

function startStrafeRunner(entity: Entity) {
  let strafeDir = Math.random() > 0.5 ? 1 : -1;

  // Clear any existing runners
  clearRun(entity, STRAFE_OUTER_RUNNER);
  clearRun(entity, STRAFE_INNER_RUNNER);

  const outerRunner = system.runInterval(() => {
    if (!entity.isValid || !isAlive(entity)) {
      clearRun(entity, STRAFE_OUTER_RUNNER);
      clearRun(entity, STRAFE_INNER_RUNNER);
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
      return;
    }

    // Start inner burst
    clearRun(entity, STRAFE_INNER_RUNNER);
    const innerRunner = system.runInterval(() => {
      if (
        !entity.isValid ||
        !isAlive(entity) ||
        !target.isValid ||
        !isAlive(target) ||
        entity.getProperty(BOSS_MODE_PROPERTY) !== InfernoMode.Ranged || distVector3(entity.location, target.location) > 32
      ) {
        clearRun(entity, STRAFE_INNER_RUNNER);
        return;
      }

      applyStrafe(entity, target, STRAFE_FORCE * strafeDir);

      if (Math.random() < 0.02) {
        strafeDir *= -1;
      }
    }, 1);

    entity.setDynamicProperty(STRAFE_INNER_RUNNER, innerRunner);

    system.runTimeout(() => {
      clearRun(entity, STRAFE_INNER_RUNNER);
      entity.setDynamicProperty(STRAFE_COOLDOWN_TIMESTAMP, system.currentTick);
    }, STRAFE_DURATION);
  }, 20);

  entity.setDynamicProperty(STRAFE_OUTER_RUNNER, outerRunner);
}

// ====== LIFECYCLE / RUNNERS ======

function startRunner(entity: Entity) {
  if (!isAliveInferno(entity)) return;

  clearRun(entity, INFERNO_RUNNER);

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

  entity.setDynamicProperty(INFERNO_RUNNER, runner);

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
  const mode = boss.getProperty(BOSS_MODE_PROPERTY);
  const projectile = data.damageSource?.damagingProjectile;
  const attacker = data.damageSource?.damagingEntity;

  if (mode === InfernoMode.Stunned) {
    let totalDamage = data.damage;
    const stunDamage = boss.getDynamicProperty(STUN_DAMAGE_PROPERTY);
    if (typeof stunDamage === "number") {
      totalDamage = totalDamage + stunDamage;
    }
    boss.setDynamicProperty(STUN_DAMAGE_PROPERTY, totalDamage);
    if (totalDamage > MAX_STUN_DAMAGE) {
      exitStun(boss);
    }
  }

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
    system.runTimeout(
      () => {
        teleportToTarget(boss);
      },
      20 + Math.random() * 80,
    );
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
      clearRun(boss, RETREAT_RUNNER);
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
        const dir = directionVector3(
          {
            x: target.location.x,
            y: target.location.y - 1,
            z: target.location.z,
          },
          boss.location,
        );
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
  const currentMode = boss.getProperty(BOSS_MODE_PROPERTY);

  if (currentMode === InfernoMode.Stunned || currentMode === InfernoMode.Push)
    return;

  const target = GetBossTarget(boss);
  if (!isAlive(target)) return;

  // Teleport cooldown
  const lastTeleport = boss.getDynamicProperty(TELEPORT_TIMESTAMP);
  if (
    typeof lastTeleport === "number" &&
    system.currentTick - lastTeleport < TELEPORT_COOLDOWN
  )
    return;

  let targetZone = target.location;

  // Clamp to 16 blocks toward the target
  const distanceToTarget = distVector3(boss.location, target.location);

  const dir = directionVector3(target.location, boss.location);

  // Clamp distance so we never overshoot
  const moveDistance = Math.min(distanceToTarget, 16);

  const projected = addVector3(
    boss.location,
    multiplyVector3Number(dir, moveDistance),
  );

  targetZone = projected;

  // Pick random nearby air
  for (let i = 0; i < 5; i++) {
    let candidate = getRandomAir(targetZone, boss.dimension, 8, 6);
    if (!candidate) {
      continue;
    }
    let distToTarget = distVector3(candidate, target.location);

    if (
      distToTarget < 8 ||
      distToTarget > 32 ||
      Math.abs(candidate.y - target.location.y) > 6 ||
      candidate.y < target.location.y
    ) {
      continue;
    }

    teleportParticleLine(boss, candidate, target.location);

    // Set teleport cooldown
    boss.setDynamicProperty(TELEPORT_TIMESTAMP, system.currentTick);

    // Switch mode
    setMode(boss, InfernoMode.Ranged);
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
  clearRun(boss, RETREAT_RUNNER);
  clearRun(boss, STRAFE_INNER_RUNNER);
  const dimension = boss.dimension;
  const distance = distVector3(boss.location, location);
  const dir = directionVector3(location, boss.location);
  for (let i = 0; i <= distance; i++) {
    spawnParticleCloud(
      "minecraft:candle_flame_particle",
      addVector3(boss.location, multiplyVector3Number(dir, i)),
      2,
      10,
      dimension,
    );
  }
  dimension.playSound("mob.ghast.fireball", boss.location, {
    volume: 0.5,
  });
  boss.teleport(location, { facingLocation: faceLocation });
  dimension.playSound("mob.ghast.fireball", location, {
    volume: 0.5,
  });
}
