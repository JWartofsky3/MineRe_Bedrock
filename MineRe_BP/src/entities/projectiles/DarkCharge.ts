import {
  Block,
  Dimension,
  Entity,
  EntityComponentTypes,
  EntityDamageCause,
  EntityHealthComponent,
  EntityProjectileComponent,
  EntityRemoveBeforeEvent,
  EntitySpawnAfterEvent,
  ProjectileHitBlockAfterEvent,
  ProjectileHitEntityAfterEvent,
  Vector3,
  system,
  world,
} from "@minecraft/server";
import { getBlocksInRadius } from "blocks/functions/getBlocksInRadius";
import {
  BlockConversion,
  DARK_CHARGE_BLOCK_CONVERSIONS,
  matchesBlockConversion,
} from "blocks/darkChargeBlockConversions";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { getHealth, isAlive, isFamily } from "entities/utilities/common";
import { particleWave } from "particles/particleWave";
import { distVector3 } from "util/vector3Functions";
import { throwEntity } from "entities/functions/throw";

const DARK_CHARGE_TYPE_ID = "minere:dark_charge";
const INDIGON_GOLEM_TYPE_ID = "minere:indigon_golem";
const CORRUPTION_STARTED_PROPERTY = "minere:indigon_golem_corruption_started";
const CORRUPTION_CHANCE = 0.1;
const DARK_PARTICLE_ID = "minere:dark_charge_particles";
const DARK_FIELD_PARTICLE_IDS = [
  "minere:dark_field",
  "minere:dark_field_2",
  "minere:dark_field_3",
  "minere:dark_field_4",
  "minere:dark_field_5",
  "minere:dark_field_6",
  "minere:dark_field_7",
];
const RADIUS = 5;
const VERTICAL_RADIUS = 2;
const MAX_DAMAGE = 12;
const MIN_DAMAGE = 8;
const TICKS_PER_RING = 2;
const DAMAGE_CHECK_DELAYS = [0, 20, 40];
const LIFESPAN_TICKS = 100;
const SPAWN_TICK_KEY = "minere:dark_charge_spawn_tick";
const HEAL_COOLDOWN_TICKS = 20 * 4;
const HEAL_COOLDOWN_KEY = "minere:dark_charge_heal_tick";
const FLAME_ENCHANTMENT_PROPERTY = "minere:dark_charge_flame";
const POWER_ENCHANTMENT_PROPERTY = "minere:dark_charge_power";
const PUNCH_ENCHANTMENT_PROPERTY = "minere:dark_charge_punch";
const HALF_DAMAGE_FAMILIES = ["undead", "skeleton", "zombie"];
const FIRE_CHANCE = 0.12;

export type DarkChargeEffectOptions = {
  radius?: number;
  verticalRadius?: number;
};

export class DarkCharge extends BaseCustomEntity {
  private impactedProjectileIds = new Set<string>();
  private expiredProjectileIds = new Set<string>();

  constructor() {
    super(DARK_CHARGE_TYPE_ID, { tick: 1 });
  }

  onEntitySpawn = (data: EntitySpawnAfterEvent): void => {
    data.entity.setDynamicProperty(SPAWN_TICK_KEY, system.currentTick);
  };

  onProjectileHitBlock(data: ProjectileHitBlockAfterEvent): void {
    this.triggerProjectileImpact(
      data.projectile.id,
      data.dimension,
      data.location,
      getProjectileOwnerId(data.projectile),
      hasFlameEnchantment(data.projectile),
      getProjectileEnchantmentLevel(
        data.projectile,
        POWER_ENCHANTMENT_PROPERTY,
      ),
      getProjectileEnchantmentLevel(
        data.projectile,
        PUNCH_ENCHANTMENT_PROPERTY,
      ),
    );
    data.projectile.remove();
  }

  onProjectileHitOtherEntity(data: ProjectileHitEntityAfterEvent): void {
    this.triggerProjectileImpact(
      data.projectile.id,
      data.dimension,
      data.location,
      getProjectileOwnerId(data.projectile),
      hasFlameEnchantment(data.projectile),
      getProjectileEnchantmentLevel(
        data.projectile,
        POWER_ENCHANTMENT_PROPERTY,
      ),
      getProjectileEnchantmentLevel(
        data.projectile,
        PUNCH_ENCHANTMENT_PROPERTY,
      ),
    );
    data.projectile.remove();
  }

  onTick = (entity: Entity): void => {
    const spawnTick = entity.getDynamicProperty(SPAWN_TICK_KEY);
    if (
      typeof spawnTick === "number" &&
      system.currentTick - spawnTick >= LIFESPAN_TICKS
    ) {
      this.expiredProjectileIds.add(entity.id);
      entity.remove();
      system.runTimeout(() => this.expiredProjectileIds.delete(entity.id), 1);
    }
  };

  onBeforeEntityRemove = (data: EntityRemoveBeforeEvent): void => {
    const projectile = data.removedEntity;
    if (
      this.impactedProjectileIds.has(projectile.id) ||
      this.expiredProjectileIds.has(projectile.id)
    ) {
      return;
    }

    const location = { ...projectile.location };
    const dimension = projectile.dimension;
    const ownerId = getProjectileOwnerId(projectile);
    const hasFlame = hasFlameEnchantment(projectile);
    const powerLevel = getProjectileEnchantmentLevel(
      projectile,
      POWER_ENCHANTMENT_PROPERTY,
    );
    const punchLevel = getProjectileEnchantmentLevel(
      projectile,
      PUNCH_ENCHANTMENT_PROPERTY,
    );
    system.run(() =>
      this.triggerProjectileImpact(
        projectile.id,
        dimension,
        location,
        ownerId,
        hasFlame,
        powerLevel,
        punchLevel,
      ),
    );
  };

  private triggerProjectileImpact(
    projectileId: string,
    dimension: Dimension,
    location: Vector3,
    ownerId?: string,
    hasFlame = false,
    powerLevel = 0,
    punchLevel = 0,
  ): void {
    if (this.impactedProjectileIds.has(projectileId)) {
      return;
    }
    this.impactedProjectileIds.add(projectileId);
    triggerDarkChargeEffect(
      dimension,
      location,
      ownerId,
      hasFlame,
      1,
      {},
      powerLevel,
      punchLevel,
    );
    system.runTimeout(() => this.impactedProjectileIds.delete(projectileId), 1);
  }
}

export function triggerDarkChargeEffect(
  dimension: Dimension,
  location: Vector3,
  excludedEntityId?: string,
  hasFlame: boolean = false,
  hardness = 0,
  options: DarkChargeEffectOptions = {},
  powerLevel = 0,
  punchLevel = 0,
): void {
  const radius = options.radius ?? RADIUS;
  const verticalRadius = options.verticalRadius ?? VERTICAL_RADIUS;
  spawnDarkFieldRings(dimension, location, radius);
  dimension.playSound("item.dark_staff.whoosh", location, {
    volume: 1,
    pitch: 1.5,
  });
  const center = {
    x: Math.round(location.x),
    y: Math.round(location.y),
    z: Math.round(location.z),
  };
  const blocksByRing = new Map<number, Block[]>();

  for (const block of getBlocksInRadius(
    dimension,
    center,
    radius,
    verticalRadius,
  )) {
    const dx = block.location.x - center.x;
    const dz = block.location.z - center.z;
    const ring = Math.floor(Math.sqrt(dx * dx + dz * dz));
    const blocks = blocksByRing.get(ring) ?? [];
    blocks.push(block);
    blocksByRing.set(ring, blocks);
  }

  for (const ring of [...blocksByRing.keys()].sort((a, b) => a - b)) {
    system.runTimeout(() => {
      const blocks = blocksByRing.get(ring) ?? [];
      for (const block of blocks) {
        affectBlock(block, hasFlame, hardness, excludedEntityId);
      }
    }, ring * TICKS_PER_RING);
  }

  for (const delay of DAMAGE_CHECK_DELAYS) {
    system.runTimeout(
      () =>
        affectEntities(
          dimension,
          center,
          excludedEntityId,
          hasFlame,
          radius,
          verticalRadius,
          powerLevel,
          punchLevel,
        ),
      delay,
    );
  }
}

function spawnDarkFieldRings(
  dimension: Dimension,
  location: Vector3,
  radius: number,
): void {
  const ringCount = Math.min(
    DARK_FIELD_PARTICLE_IDS.length,
    Math.max(1, Math.floor(radius)),
  );
  for (let ringIndex = 0; ringIndex < ringCount; ringIndex++) {
    dimension.spawnParticle(DARK_FIELD_PARTICLE_IDS[ringIndex], location);
  }
}

function affectEntities(
  dimension: Dimension,
  center: Vector3,
  excludedEntityId?: string,
  hasFlame = false,
  radius = RADIUS,
  verticalRadius = VERTICAL_RADIUS,
  powerLevel = 0,
  punchLevel = 0,
): void {
  for (const entity of dimension.getEntities({
    location: center,
    maxDistance: Math.sqrt(radius * radius + verticalRadius * verticalRadius),
    excludeTypes: ["minecraft:item", DARK_CHARGE_TYPE_ID],
  })) {
    if (
      entity.id === excludedEntityId ||
      !isAlive(entity) ||
      isFamily(entity, "inanimate")
    ) {
      continue;
    }

    const dx = entity.location.x - center.x;
    const dz = entity.location.z - center.z;
    const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
    if (
      horizontalDistance > radius ||
      Math.abs(entity.location.y - center.y) > verticalRadius
    ) {
      continue;
    }

    const damageMultiplier = HALF_DAMAGE_FAMILIES.some((family) =>
      isFamily(entity, family),
    )
      ? 0.5
      : 1;
    const damage =
      MIN_DAMAGE +
      (MAX_DAMAGE - MIN_DAMAGE) *
        (1 - horizontalDistance / radius) *
        damageMultiplier +
      powerLevel;
    dimension.spawnParticle(DARK_PARTICLE_ID, entity.location);
    if (isFamily(entity, "corrupted")) {
      const health = getHealth(entity);
      health.setCurrentValue(
        Math.min(health.effectiveMax, health.currentValue + damage),
      );
      continue;
    }
    if (damage > 0) {
      const health = getHealth(entity);
      const healthBefore = health?.currentValue ?? 0;
      if (entity.applyDamage(damage, { cause: EntityDamageCause.magic })) {
        if (punchLevel > 0) {
          throwEntity(center, entity, punchLevel * 1.5, punchLevel * 0.5);
        }
        if (hasFlame && Math.random() < 0.5) {
          entity.setOnFire(5);
        }
        tryCorruptIndigonGolem(entity);
        const damageDealt = Math.max(0, healthBefore - health.currentValue);
        healOwnerFromDamage(excludedEntityId, entity, damageDealt);
      }
    }
  }
}

function tryCorruptIndigonGolem(entity: Entity): void {
  if (
    entity.typeId !== INDIGON_GOLEM_TYPE_ID ||
    entity.getDynamicProperty(CORRUPTION_STARTED_PROPERTY) === true ||
    Math.random() >= CORRUPTION_CHANCE
  ) {
    return;
  }

  entity.setDynamicProperty(CORRUPTION_STARTED_PROPERTY, true);
  entity.triggerEvent("minere:corrupt_indigon_golem");
}

function healOwnerFromDamage(
  ownerId: string | undefined,
  target: Entity,
  damageDealt: number,
): void {
  if (
    !ownerId ||
    damageDealt <= 0 ||
    HALF_DAMAGE_FAMILIES.some((family) => isFamily(target, family))
  ) {
    return;
  }

  const owner = world.getEntity(ownerId);
  if (
    !isAlive(owner) ||
    owner.dimension !== target.dimension ||
    distVector3(owner.location, target.location) > 10
  ) {
    return;
  }

  const lastHealTick = owner.getDynamicProperty(HEAL_COOLDOWN_KEY);
  if (
    typeof lastHealTick === "number" &&
    system.currentTick - lastHealTick < HEAL_COOLDOWN_TICKS
  ) {
    return;
  }

  const ownerHealth = getHealth(owner) as EntityHealthComponent;
  ownerHealth.setCurrentValue(
    Math.min(
      ownerHealth.effectiveMax,
      ownerHealth.currentValue + damageDealt / 2,
    ),
  );
  owner.setDynamicProperty(HEAL_COOLDOWN_KEY, system.currentTick);
  particleWave({
    particle: "minere:dark_wave",
    dimension: owner.dimension,
    startLocation: getEntityCenter(target),
    endLocation: getEntityCenter(owner),
    stepDistance: 0.5,
    ticksPerStep: 0,
  });
}

function getEntityCenter(entity: Entity): Vector3 {
  const headLocation = entity.getHeadLocation();
  return {
    x: entity.location.x,
    y: (entity.location.y + headLocation.y) / 2,
    z: entity.location.z,
  };
}

function getProjectileOwnerId(projectile: Entity): string | undefined {
  const projectileComponent = projectile.getComponent(
    EntityComponentTypes.Projectile,
  ) as EntityProjectileComponent | undefined;
  return projectileComponent?.owner?.id;
}

function hasFlameEnchantment(projectile: Entity): boolean {
  return projectile.getDynamicProperty(FLAME_ENCHANTMENT_PROPERTY) === true;
}

function getProjectileEnchantmentLevel(
  projectile: Entity,
  property: string,
): number {
  const value = projectile.getDynamicProperty(property);
  return typeof value === "number" ? value : 0;
}

function affectBlock(
  block: Block,
  hasFlame: boolean,
  hardness: number,
  excludedEntityId: string | undefined,
): void {
  if (!block?.isValid) {
    return;
  }

  const originalBlockType = block.typeId;
  const convertedBlockType = getConvertedBlockType(originalBlockType, hardness);
  if (convertedBlockType) {
    block.setType(convertedBlockType);
    spawnDarkParticles(block.location, block.dimension);
    if (
      convertedBlockType !== "minecraft:air" &&
      (!excludedEntityId ||
        distVector3(
          block.location,
          world.getEntity(excludedEntityId)?.location ?? { x: 0, y: 0, z: 0 },
        ) > 3)
    ) {
      tryPlaceFireAbove(block, hasFlame ? FIRE_CHANCE : 0);
    }
  }
}

function getConvertedBlockType(
  typeId: string,
  hardness: number,
): string | undefined {
  const cappedHardness = Math.max(
    0,
    Math.min(Math.floor(hardness), DARK_CHARGE_BLOCK_CONVERSIONS.length - 1),
  );
  for (let mapIndex = cappedHardness; mapIndex > 0; mapIndex--) {
    const conversions = DARK_CHARGE_BLOCK_CONVERSIONS[mapIndex];
    const conversion = conversions.find((entry) =>
      matchesBlockConversion(typeId, entry),
    );
    if (!conversion || Math.random() >= conversion.chance) {
      continue;
    }

    return conversion.to[Math.floor(Math.random() * conversion.to.length)];
  }
}

function tryPlaceFireAbove(block: Block, chance: number): void {
  const blockAbove = block.above();
  if (Math.random() < chance && blockAbove?.isValid && blockAbove.isAir) {
    blockAbove.setType("minecraft:fire");
  }
}

function spawnDarkParticles(location: Vector3, dimension: Dimension): void {
  dimension.spawnParticle(DARK_PARTICLE_ID, {
    x: location.x + 0.5,
    y: location.y + 0.5,
    z: location.z + 0.5,
  });
}
