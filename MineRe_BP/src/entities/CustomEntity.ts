import {
  DataDrivenEntityTriggerAfterEvent,
  Entity,
  EffectAddBeforeEvent,
  EffectAddAfterEvent,
  EntityDieAfterEvent,
  EntityHealthChangedAfterEvent,
  EntityHitBlockAfterEvent,
  EntityHitEntityAfterEvent,
  EntityHurtAfterEvent,
  EntityLoadAfterEvent,
  EntityRemoveBeforeEvent,
  EntityRemoveAfterEvent,
  ProjectileHitEntityAfterEvent,
  PlayerInteractWithEntityBeforeEvent,
  PlayerInteractWithEntityAfterEvent,
  EntitySpawnAfterEvent,
  ProjectileHitBlockAfterEvent,
  EntityQueryOptions,
} from "@minecraft/server";

export type TickInterval = number | [number, number];

export type CustomEntityProperties = {
  // If > 0, onTick runs every N ticks.
  // If tuple, onTick runs every random duration between [min, max].
  // If 0, onTick is disabled.
  tick?: TickInterval;

  // Query options for finding targets.
  targetQuery?: EntityQueryOptions;

  //scan on tick for new targets every N ticks, using targetQuery options. Set to 0 to disable.
  targetScanInterval?: number;
};

export interface CustomEntity {
  // The entity typeId this handler targets
  typeId: string;

  // Optional properties for this entity type.
  properties?: CustomEntityProperties;

  // Sets up listeners for this entity. Should be the only call needed in main.ts.
  register(): void;

  // Called when this entity is hurt.
  onEntityHurt?(data: EntityHurtAfterEvent): void;

  // Called when this entity hurts another entity.
  onEntityHurtEntity?(data: EntityHurtAfterEvent): void;

  // Called when this entity hits another entity (melee).
  onEntityHitEntity?(data: EntityHitEntityAfterEvent): void;

  // Called when this entity hits a block (melee).
  onEntityHitBlock?(data: EntityHitBlockAfterEvent): void;

  // Called when an effect is added to this entity.
  onEffectAdd?(data: EffectAddAfterEvent): void;

  // Called before an effect is added to this entity.
  onBeforeEffectAdd?(data: EffectAddBeforeEvent): void;

  // Called before this entity is removed/unloaded.
  onBeforeEntityRemove?(data: EntityRemoveBeforeEvent): void;

  // Called before a player interacts with this entity.
  onBeforePlayerInteractWithEntity?(
    data: PlayerInteractWithEntityBeforeEvent,
  ): void;

  // Called when this entity health changes.
  onEntityHealthChanged?(data: EntityHealthChangedAfterEvent): void;

  // Called when a projectile hits this entity.
  onProjectileHitEntity?(data: ProjectileHitEntityAfterEvent): void;

  // Called when this entity is the source of a projectile that hits another entity.
  onProjectileHitOtherEntity?(data: ProjectileHitEntityAfterEvent): void;

  // Called when this entity is a projectile and hits a block.
  onProjectileHitBlock?(data: ProjectileHitBlockAfterEvent): void;

  // Called when a player interacts with this entity.
  onPlayerInteractWithEntity?(data: PlayerInteractWithEntityAfterEvent): void;

  // Called on interval based on tick.
  onTick?(entity: Entity): void;

  // Called when this entity spawns.
  onEntitySpawn?(data: EntitySpawnAfterEvent): void;

  // Called when this entity is loaded.
  onEntityLoad?(data: EntityLoadAfterEvent): void;

  // Called when this entity dies.
  onEntityDie?(data: EntityDieAfterEvent): void;

  // Called when this entity is removed/unloaded.
  onEntityRemove?(data: EntityRemoveAfterEvent): void;

  // Called for data-driven triggers.
  onDataDrivenEntityTrigger?(data: DataDrivenEntityTriggerAfterEvent): void;

  getTarget?(source: Entity): Entity | null;

  setTarget?(source: Entity, target: Entity | null): void;

  findTarget?(source: Entity, queryOptions?: EntityQueryOptions): Entity | null;
}
