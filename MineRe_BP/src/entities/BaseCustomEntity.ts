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
  Player,
  GameMode,
} from "@minecraft/server";
import { CustomEntity, CustomEntityProperties } from "entities/CustomEntity";
import { isAlive } from "mob/mob_utils";
import { distVector3 } from "util/vector3Functions";

const TARGET_PROPERTY = "minere:entity_target";
const TICK_INDEX_PROPERTY = "minere:tick_index";

export abstract class BaseCustomEntity implements CustomEntity {
  typeId: string;

  properties?: CustomEntityProperties;

  // Prevents double registration.
  private registered = false;

  // Dynamic property key used to store the active tick runner id on the entity.
  private tickRunnerKey: string;

  constructor(typeId: string, properties?: CustomEntityProperties) {
    this.typeId = typeId;
    this.properties = {
      tick: properties?.tick ?? 0,
      targetQuery: properties?.targetQuery ?? {
        maxDistance: 32,
        excludeGameModes: [GameMode.Creative, GameMode.Spectator],
      },
      targetScanInterval: properties?.targetScanInterval ?? 0,
    };
    this.tickRunnerKey = `minere:tick_runner:${typeId}`;
  }

  register(): void {
    if (this.registered) {
      return;
    }
    this.registered = true;
    if (!this.typeId) {
      world.sendMessage("ERROR: registered entity with undefined typeId");
      return;
    }

    // Forward hurt events for this entity type.
    world.afterEvents.entityHurt.subscribe((data: EntityHurtAfterEvent) => {
      const attacker = data.damageSource?.damagingEntity;
      const hurt = data.hurtEntity;
      if (hurt?.typeId === this.typeId) {
        this.onEntityHurt?.(data);
        if (isAlive(attacker)) {
          this.setTarget(hurt, attacker);
        }
      }

      if (
        attacker?.typeId === this.typeId ||
        data?.damageSource?.damagingProjectile?.typeId === this.typeId
      ) {
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

  getTarget(source: Entity): Entity | null {
    if (!isAlive(source)) {
      return null;
    }
    const targetQuery = this.properties?.targetQuery;
    const targetId = source.getDynamicProperty(TARGET_PROPERTY) as string;
    if (!targetId) {
      return null;
    }
    const existing = world.getEntity(targetId);
    if (!isAlive(existing)) {
      return null;
    }
    if (existing.dimension !== source.dimension) {
      return null;
    }
    if (
      distVector3(existing.location, source.location) > targetQuery?.maxDistance
    ) {
      return null;
    }
    if (existing instanceof Player) {
      if (targetQuery.excludeGameModes?.includes(existing.getGameMode())) {
        return null;
      }
    }
    return existing;
  }

  setTarget(source: Entity, target: Entity | null): void {
    if (!isAlive(target)) {
      return;
    }
    source.setDynamicProperty(TARGET_PROPERTY, target.id);
  }

  findTarget(source: Entity): Entity | null {
    const targetQuery = this.properties?.targetQuery;
    if (!isAlive(source)) {
      return null;
    }

    const dimension = source.dimension;
    let target = this.getTarget(source);
    if (target !== null) {
      return target;
    }

    const entities = dimension.getEntities({
      location: source.location,
      ...targetQuery,
    });

    let bestDist = Number.POSITIVE_INFINITY;

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      if (!isAlive(entity)) {
        continue;
      }
      const dist = distVector3(entity.location, source.location);
      if (dist < bestDist) {
        bestDist = dist;
        target = entity;
      }
    }

    if (target) {
      source.setDynamicProperty(TARGET_PROPERTY, target.id);
    }

    return target;
  }

  private startTicking(entity: Entity): void {
    const tick = this.properties?.tick;
    if (!tick || !this.onTick) {
      return;
    }
    if (!entity?.isValid) {
      return;
    }
    this.clearRunner(entity);

    const targetScanInterval = this.properties?.targetScanInterval;
    if (targetScanInterval > 0) {
      if (targetScanInterval === 1) {
        this.findTarget(entity);
      } else {
        const currentTick = entity.getDynamicProperty(
          TICK_INDEX_PROPERTY,
        ) as number;
        let targetTick = (currentTick ?? 0) + 1;
        if (targetTick === this.properties.targetScanInterval) {
          this.findTarget(entity);
          targetTick = 0;
        }
        entity.setDynamicProperty(TICK_INDEX_PROPERTY, targetTick);
      }
    }

    if (typeof tick === "number") {
      const delay = Math.floor(tick);
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

  private setRunner(entity: Entity, runner: number): void {
    entity.setDynamicProperty(this.tickRunnerKey, runner);
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
  }

  private getNextTickDelay(): number {
    const min = Math.min(this.properties.tick[0], this.properties.tick[1]);
    const max = Math.max(this.properties.tick[0], this.properties.tick[1]);
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
