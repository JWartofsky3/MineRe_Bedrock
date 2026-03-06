import { Entity, system } from "@minecraft/server";

type InfernoPushDynamicProperties = {
  CYCLE_COUNTER: string;
  LAST_PUSH_CYCLE: string;
};

type InfernoPushCombatProperties = {
  PUSH_COOLDOWN: number;
  PUSH_DELAY: number;
};

type InfernoPushOptions = {
  entity: Entity;
  getMode: (entity: Entity) => number;
  setMode: (entity: Entity, mode: number) => void;
  killMovement: (entity: Entity) => void;
  dynamicProperties: InfernoPushDynamicProperties;
  combatProperties: InfernoPushCombatProperties;
  pushMode: number;
  pushSoundId: string;
};

export function canInfernoEnterPush(
  entity: Entity,
  dynamicProperties: InfernoPushDynamicProperties,
  combatProperties: InfernoPushCombatProperties,
): boolean {
  const currentCycle = entity.getDynamicProperty(dynamicProperties.CYCLE_COUNTER);
  const lastPushCycle = entity.getDynamicProperty(
    dynamicProperties.LAST_PUSH_CYCLE,
  );
  const currentValue = typeof currentCycle === "number" ? currentCycle : 0;
  const lastValue = typeof lastPushCycle === "number" ? lastPushCycle : 0;
  return currentValue - lastValue >= combatProperties.PUSH_COOLDOWN;
}

export function enterInfernoPush(options: InfernoPushOptions): void {
  const {
    entity,
    getMode,
    setMode,
    killMovement,
    dynamicProperties,
    combatProperties,
    pushMode,
    pushSoundId,
  } = options;
  markPushCycle(entity, dynamicProperties);
  setMode(entity, pushMode);
  killMovement(entity);
  system.runTimeout(() => {
    if (!entity?.isValid) {
      return;
    }
    if (getMode(entity) !== pushMode) {
      return;
    }
    killMovement(entity);
    entity.dimension.playSound(pushSoundId, entity.location);
  }, combatProperties.PUSH_DELAY);
}

function markPushCycle(
  entity: Entity,
  dynamicProperties: InfernoPushDynamicProperties,
): void {
  const currentCycle = entity.getDynamicProperty(dynamicProperties.CYCLE_COUNTER);
  const currentValue = typeof currentCycle === "number" ? currentCycle : 0;
  entity.setDynamicProperty(dynamicProperties.LAST_PUSH_CYCLE, currentValue);
}
