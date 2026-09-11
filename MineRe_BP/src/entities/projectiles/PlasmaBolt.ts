import {
  Entity,
  EntityComponentTypes,
  EntityInventoryComponent,
  EntityProjectileComponent,
  EntitySpawnAfterEvent,
  EntityDamageCause,
  ProjectileHitBlockAfterEvent,
  ProjectileHitEntityAfterEvent,
  system,
} from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { createCompanionMessenger } from "entities/helpers/companionMessages";
import { setPlasmaCannonActive } from "entities/mobs/IndigonGolem";

const PLASMA_BOLT = "minere:plasma_bolt";
const INDIGON_GOLEM = "minere:indigon_golem";
const CORRUPTED_INDIGON_GOLEM = "minere:corrupted_indigon_golem";
const ENDER_PLASMA = "minere:ender_plasma";
const AMMUNITION_CONSUME_CHANCE = 0.15;
const { sendToOwner: sendIndigonGolemMessageToOwner } =
  createCompanionMessenger({
    commandRange: 32,
    nameColor: "§5",
    nameTranslationKey: "entity.minere:indigon_golem.name",
  });
const OUT_OF_AMMUNITION_PROPERTY =
  "minere:indigon_golem_out_of_ammunition_notified";
const BLASTER_POWER_PROPERTY = "minere:blaster_plasma_power";
const BLASTER_PUNCH_PROPERTY = "minere:blaster_plasma_punch";
const BLASTER_FLAME_PROPERTY = "minere:blaster_plasma_flame";
const BLASTER_EXPLOSION_POWER = 1.85;

export class PlasmaBolt extends BaseCustomEntity {
  constructor() {
    super(PLASMA_BOLT);
  }

  onEntitySpawn = (data: EntitySpawnAfterEvent): void => {
    system.run(() => {
      if (!data.entity.isValid) {
        return;
      }
      const projectile = data.entity.getComponent(
        EntityComponentTypes.Projectile,
      ) as EntityProjectileComponent | undefined;
      const owner = projectile?.owner;
      if (
        owner?.typeId !== INDIGON_GOLEM &&
        owner?.typeId !== CORRUPTED_INDIGON_GOLEM
      ) {
        return;
      }
      consumeAmmunitionWithChance(owner);
    });
  };

  onProjectileHitBlock(data: ProjectileHitBlockAfterEvent): void {
    triggerBlasterImpact(data.projectile, data.dimension, data.location);
  }

  onProjectileHitOtherEntity(data: ProjectileHitEntityAfterEvent): void {
    const target = data.getEntityHit()?.entity;
    const powerLevel = data.projectile.getDynamicProperty(
      BLASTER_POWER_PROPERTY,
    );
    const projectileComponent = data.projectile.getComponent(
      EntityComponentTypes.Projectile,
    ) as EntityProjectileComponent;
    if (target && typeof powerLevel === "number" && powerLevel > 0) {
      target.applyDamage(powerLevel, {
        damagingEntity: projectileComponent.owner,
        damagingProjectile: data.projectile,
        cause: EntityDamageCause.magic,
      });
    }
    triggerBlasterImpact(data.projectile, data.dimension, data.location);
  }
}

function triggerBlasterImpact(
  projectile: Entity,
  dimension: Entity["dimension"],
  location: Entity["location"],
): void {
  const punchLevel = projectile.getDynamicProperty(BLASTER_PUNCH_PROPERTY);
  const hasFlame =
    projectile.getDynamicProperty(BLASTER_FLAME_PROPERTY) === true;
  if (typeof punchLevel !== "number") {
    return;
  }
  const projectileComponent = projectile.getComponent(
    EntityComponentTypes.Projectile,
  ) as EntityProjectileComponent;
  dimension.createExplosion(location, BLASTER_EXPLOSION_POWER + punchLevel, {
    breaksBlocks: true,
    causesFire: hasFlame,
    source: projectileComponent.owner,
  });
  projectile.remove();
}

function consumeAmmunitionWithChance(golem: Entity): void {
  const inventory = golem.getComponent(EntityComponentTypes.Inventory) as
    | EntityInventoryComponent
    | undefined;
  const container = inventory?.container;
  if (!container || !hasEnderPlasma(container)) {
    notifyOutOfAmmunition(golem);
    return;
  }

  golem.setDynamicProperty(OUT_OF_AMMUNITION_PROPERTY, false);
  if (Math.random() >= AMMUNITION_CONSUME_CHANCE) {
    return;
  }

  for (let slot = 0; slot < container.size; slot++) {
    const item = container.getItem(slot);
    if (item?.typeId !== ENDER_PLASMA) {
      continue;
    }

    if (item.amount <= 1) {
      container.setItem(slot, undefined);
    } else {
      item.amount--;
      container.setItem(slot, item);
    }

    if (!hasEnderPlasma(container)) {
      notifyOutOfAmmunition(golem);
    }
    return;
  }

  notifyOutOfAmmunition(golem);
}

function hasEnderPlasma(
  container: EntityInventoryComponent["container"],
): boolean {
  for (let slot = 0; slot < container.size; slot++) {
    if (container.getItem(slot)?.typeId === ENDER_PLASMA) {
      return true;
    }
  }
  return false;
}

function notifyOutOfAmmunition(golem: Entity): void {
  setPlasmaCannonActive(golem, false);
  if (golem.getDynamicProperty(OUT_OF_AMMUNITION_PROPERTY) === true) {
    return;
  }
  golem.setDynamicProperty(OUT_OF_AMMUNITION_PROPERTY, true);
  sendIndigonGolemMessageToOwner(
    golem,
    "message.minere.indigon_golem.out_of_ammunition",
  );
}
