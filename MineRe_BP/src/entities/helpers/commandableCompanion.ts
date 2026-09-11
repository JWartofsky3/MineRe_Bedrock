import {
  Entity,
  EntityComponentTypes,
  EntityTameableComponent,
  Player,
} from "@minecraft/server";

export function getTameable(
  entity: Entity,
): EntityTameableComponent | undefined {
  return entity.getComponent(EntityComponentTypes.Tameable) as
    | EntityTameableComponent
    | undefined;
}

export function isTamed(entity: Entity): boolean {
  return getTameable(entity)?.isTamed ?? false;
}

export function isTamedBy(entity: Entity, player: Player): boolean {
  return getTameable(entity)?.tamedToPlayerId === player.id;
}

export function getTamedOwner(entity: Entity): Player | undefined {
  return getTameable(entity)?.tamedToPlayer;
}

export function takeCommand(
  entity: Entity,
  player: Player,
  commandEvent: string,
): boolean {
  if (isTamed(entity)) {
    return isTamedBy(entity, player);
  }

  entity.triggerEvent(commandEvent);
  return getTameable(entity)?.tame(player) ?? false;
}
