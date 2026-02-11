import {
  world,
  system,
  Entity,
  EntityComponentTypes,
  EntityTypeFamilyComponent,
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
  EntitySpawnAfterEvent,
  ProjectileHitEntityAfterEvent,
  PlayerInteractWithEntityAfterEvent,
  PlayerInteractWithEntityBeforeEvent,
  DataDrivenEntityTriggerAfterEvent,
  ProjectileHitBlockAfterEvent,
} from "@minecraft/server";
import { CustomEntity, TickInterval } from "entities/CustomEntity";

export abstract class BaseCustomEntity implements CustomEntity {
  // Target entity type for this handler.
  typeId: string;

  // Tick interval configuration.
  tick: TickInterval;

  // Prevents double registration.
  private registered = false;

  // Dynamic property key used to store the active tick runner id on the entity.
  private tickRunnerKey: string;

  // In-memory runner ids to support removal events.
  private tickRunners = new Map<string, number>();

  constructor(typeId: string, tick?: TickInterval) {
    this.typeId = typeId;
    this.tick = tick;
    this.tickRunnerKey = `minere:tick_runner:${typeId}`;
  }

  register(): void {
    if (this.registered) {
      return;
    }
    this.registered = true;

    // Forward hurt events for this entity type.
    world.afterEvents.entityHurt.subscribe((data: EntityHurtAfterEvent) => {
      const hurt = data.hurtEntity;
      if (hurt?.typeId === this.typeId) {
        this.onEntityHurt?.(data);
      }

      const attacker = data.damageSource?.damagingEntity;
      if (attacker?.typeId === this.typeId || data?.damageSource?.damagingProjectile?.typeId === this.typeId) {
        this.onEntityHurtEntity?.(data);
      }
    });

    // Start ticking on spawn.
    world.afterEvents.entitySpawn.subscribe((data: EntitySpawnAfterEvent) => {
      const entity = data.entity;
      if (entity?.typeId === this.typeId) {
        this.onEntitySpawn?.(data);
        this.startTicking(entity);
      }
    });

    // Start ticking on load.
    world.afterEvents.entityLoad.subscribe((data: EntityLoadAfterEvent) => {
      const entity = data.entity;
      if (entity?.typeId === this.typeId) {
        this.onEntityLoad?.(data);
        this.startTicking(entity);
      }
    });

    // Stop ticking on death.
    world.afterEvents.entityDie.subscribe((data: EntityDieAfterEvent) => {
      if (data.deadEntity?.typeId === this.typeId) {
        this.onEntityDie?.(data);
        this.stopTicking(data.deadEntity);
      }
    });

    // Before-events for this entity type.
    world.beforeEvents.effectAdd.subscribe((data: EffectAddBeforeEvent) => {
      if (data.entity?.typeId === this.typeId) {
        this.onBeforeEffectAdd?.(data);
      }
    });

    world.beforeEvents.entityRemove.subscribe(
      (data: EntityRemoveBeforeEvent) => {
        if (data.removedEntity?.typeId === this.typeId) {
          this.onBeforeEntityRemove?.(data);
        }
      },
    );

    world.beforeEvents.playerInteractWithEntity.subscribe(
      (data: PlayerInteractWithEntityBeforeEvent) => {
        if (data.target?.typeId === this.typeId) {
          this.onBeforePlayerInteractWithEntity?.(data);
        }
      },
    );

    // Stop ticking when entity is removed/unloaded.
    world.afterEvents.entityRemove.subscribe((data: EntityRemoveAfterEvent) => {
      if (data.typeId === this.typeId) {
        this.onEntityRemove?.(data);
        this.stopTickingById(data.removedEntityId);
      }
    });

    world.afterEvents.entityHitEntity.subscribe(
      (data: EntityHitEntityAfterEvent) => {
        if (data.damagingEntity?.typeId === this.typeId) {
          this.onEntityHitEntity?.(data);
        }
      },
    );

    world.afterEvents.entityHitBlock.subscribe(
      (data: EntityHitBlockAfterEvent) => {
        if (data.damagingEntity?.typeId === this.typeId) {
          this.onEntityHitBlock?.(data);
        }
      },
    );

    world.afterEvents.effectAdd.subscribe((data: EffectAddAfterEvent) => {
      if (data.entity?.typeId === this.typeId) {
        this.onEffectAdd?.(data);
      }
    });

    world.afterEvents.entityHealthChanged.subscribe(
      (data: EntityHealthChangedAfterEvent) => {
        if (data.entity?.typeId === this.typeId) {
          this.onEntityHealthChanged?.(data);
        }
      },
    );

    world.afterEvents.projectileHitEntity.subscribe(
      (data: ProjectileHitEntityAfterEvent) => {
        if (data.getEntityHit()?.entity?.typeId === this.typeId) {
          this.onProjectileHitEntity?.(data);
        }
        if (data.projectile?.typeId === this.typeId) {
          this.onProjectileHitOtherEntity?.(data);
        }
      },
    );

    world.afterEvents.projectileHitBlock.subscribe(
      (data: ProjectileHitBlockAfterEvent) => {
        if (data.projectile?.typeId === this.typeId) {
          this.onProjectileHitBlock?.(data);
        }
      },
    );

    world.afterEvents.playerInteractWithEntity.subscribe(
      (data: PlayerInteractWithEntityAfterEvent) => {
        if (data.target?.typeId === this.typeId) {
          this.onPlayerInteractWithEntity?.(data);
        }
      },
    );

    // Data-driven triggers for this entity type.
    world.afterEvents.dataDrivenEntityTrigger.subscribe(
      (data: DataDrivenEntityTriggerAfterEvent) => {
        if (data.entity?.typeId === this.typeId) {
          this.onDataDrivenEntityTrigger?.(data);
        }
      },
    );
  }

  onEntityHurt?(data: EntityHurtAfterEvent): void;
  onEntityHurtEntity?(data: EntityHurtAfterEvent): void;
  onEntityHitEntity?(data: EntityHitEntityAfterEvent): void;
  onEntityHitBlock?(data: EntityHitBlockAfterEvent): void;
  onEffectAdd?(data: EffectAddAfterEvent): void;
  onBeforeEffectAdd?(data: EffectAddBeforeEvent): void;
  onBeforeEntityRemove?(data: EntityRemoveBeforeEvent): void;
  onBeforePlayerInteractWithEntity?(
    data: PlayerInteractWithEntityBeforeEvent,
  ): void;
  onEntityHealthChanged?(data: EntityHealthChangedAfterEvent): void;
  onProjectileHitEntity?(data: ProjectileHitEntityAfterEvent): void;
  onProjectileHitOtherEntity?(data: ProjectileHitEntityAfterEvent): void;
  onProjectileHitBlock?(data: ProjectileHitBlockAfterEvent): void;
  onPlayerInteractWithEntity?(data: PlayerInteractWithEntityAfterEvent): void;
  onTick?(entity: Entity): void;
  onEntitySpawn?(data: EntitySpawnAfterEvent): void;
  onEntityLoad?(data: EntityLoadAfterEvent): void;
  onEntityDie?(data: EntityDieAfterEvent): void;
  onEntityRemove?(data: EntityRemoveAfterEvent): void;
  onDataDrivenEntityTrigger?(data: DataDrivenEntityTriggerAfterEvent): void;

  private startTicking(entity: Entity): void {
    if (!this.tick || !this.onTick) {
      return;
    }
    if (!entity?.isValid) {
      return;
    }
    this.clearExistingRunner(entity);

    if (typeof this.tick === "number") {
      const delay = Math.floor(this.tick);
      if (delay <= 0) {
        return;
      }
      const runner = system.runInterval(() => {
        if (!this.isEntityLoaded(entity)) {
          this.stopTicking(entity);
          return;
        }
        this.onTick?.(entity);
      }, delay);
      this.setRunner(entity, runner);
      return;
    }

    const scheduleNext = () => {
      const delay = this.getNextTickDelay();
      if (delay <= 0) {
        this.stopTicking(entity);
        return;
      }
      const runner = system.runTimeout(() => {
        if (!this.isEntityLoaded(entity)) {
          this.stopTicking(entity);
          return;
        }
        this.onTick?.(entity);
        this.clearRunner(entity);
        scheduleNext();
      }, delay);
      this.setRunner(entity, runner);
    };

    scheduleNext();
  }

  private stopTicking(entity: Entity): void {
    this.clearRunner(entity);
  }

  private clearExistingRunner(entity: Entity): void {
    const existing = entity.getDynamicProperty(this.tickRunnerKey);
    if (typeof existing === "number") {
      system.clearRun(existing);
    }
    const cached = this.tickRunners.get(entity.id);
    if (typeof cached === "number") {
      system.clearRun(cached);
    }
    this.tickRunners.delete(entity.id);
    entity.setDynamicProperty(this.tickRunnerKey, undefined);
  }

  private stopTickingById(entityId: string): void {
    const runner = this.tickRunners.get(entityId);
    if (typeof runner === "number") {
      system.clearRun(runner);
    }
    this.tickRunners.delete(entityId);
  }

  private setRunner(entity: Entity, runner: number): void {
    entity.setDynamicProperty(this.tickRunnerKey, runner);
    this.tickRunners.set(entity.id, runner);
  }

  private clearRunner(entity: Entity): void {
    if (!entity?.isValid) {
      return;
    }
    const runner = entity.getDynamicProperty(this.tickRunnerKey);
    if (typeof runner === "number") {
      system.clearRun(runner);
    }
    entity.setDynamicProperty(this.tickRunnerKey, undefined);
    this.tickRunners.delete(entity.id);
  }

  private getNextTickDelay(): number {
    const min = Math.min(this.tick[0], this.tick[1]);
    const max = Math.max(this.tick[0], this.tick[1]);
    if (max <= 0) {
      return 0;
    }

    const clampedMin = Math.max(1, Math.floor(min));
    const clampedMax = Math.max(1, Math.floor(max));
    return (
      Math.floor(Math.random() * (clampedMax - clampedMin + 1)) + clampedMin
    );
  }

  private isEntityLoaded(entity: Entity): boolean {
    if (!entity || !entity.isValid || !entity.dimension) {
      return false;
    }
    const family = entity.getComponent(
      EntityComponentTypes.TypeFamily,
    ) as EntityTypeFamilyComponent;
    const families = family?.getTypeFamilies();
    const entities = entity.dimension.getEntities({
      maxDistance: 1.0,
      location: entity.location,
      families,
    });
    for (let i = 0; i < entities.length; i++) {
      if (entities[i].id === entity.id) {
        return true;
      }
    }
    return false;
  }
}
