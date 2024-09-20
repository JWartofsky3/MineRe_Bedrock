import {
  system,
  ItemComponentHitEntityEvent,
  ItemComponentTypes,
  ItemCooldownComponent,
  Player,
  world,
  Entity,
  EntityComponentTypes,
  EntityTypeFamilyComponent,
  EntityDamageCause,
  EntityHealthComponent,
} from "@minecraft/server";
import { addVector3, randomVector3 } from "util/vector3Functions";

type enderStrikeStats = {
  targetDamage: number;
  multiDamage: number;
  count: number;
  range: number;
};

const strikeDamage = new Map<string, enderStrikeStats>();
const defaultStrike: enderStrikeStats = {
  targetDamage: 2,
  multiDamage: 5,
  count: 3,
  range: 9,
};
strikeDamage.set("minere:enderon_sword", {
  targetDamage: 4,
  multiDamage: 6,
  count: 4,
  range: 10,
});
strikeDamage.set("minere:enderon_axe", {
  targetDamage: 7,
  multiDamage: 5,
  count: 2,
  range: 8,
});

export const applyEnderStrike = (data: ItemComponentHitEntityEvent) => {
  if (data.attackingEntity.typeId !== "minecraft:player") {
    return;
  }
  const health = data.hitEntity.getComponent(
    EntityComponentTypes.Health,
  ) as EntityHealthComponent;
  if (!health) {
    return;
  }
  const player = data.attackingEntity as Player;
  // check cooldown
  const cooldownComponent = data?.itemStack.getComponent(
    ItemComponentTypes.Cooldown,
  ) as ItemCooldownComponent;
  if (
    !cooldownComponent ||
    cooldownComponent.getCooldownTicksRemaining(player) > 0
  ) {
    return;
  }
  cooldownComponent.startCooldown(player);
  const stats = strikeDamage.get(data.itemStack?.typeId) || defaultStrike;

  //apply to hit entity
  if (health.currentValue < stats.targetDamage) {
    data?.hitEntity.applyDamage(health.currentValue * 20, {
      cause: EntityDamageCause.magic,
      damagingEntity: data.attackingEntity,
    });
  } else {
    health.setCurrentValue(health.currentValue - stats.targetDamage);
  }
  enderEffects(data.hitEntity);

  //apply multi hits
  const entities = getNearbyEntities(
    data.attackingEntity,
    data.hitEntity,
    stats,
  );

  for (let i = 0; i < entities.length; i++) {
    system.runTimeout(() => {
      const entity = entities[i];
      entity.applyDamage(stats.multiDamage, {
        cause: EntityDamageCause.magic,
        damagingEntity: data.attackingEntity,
      });
      enderEffects(entity);
    }, i * 4);
  }
};

function getNearbyEntities(
  attacker: Entity,
  targetEntity: Entity,
  stats: enderStrikeStats,
): Entity[] {
  const typeFamily = targetEntity?.getComponent(
    EntityComponentTypes.TypeFamily,
  ) as EntityTypeFamilyComponent;
  let entities = targetEntity?.dimension
    .getEntities({
      closest: stats.count,
      location: targetEntity?.location,
      maxDistance: stats.range,
      families: typeFamily.getTypeFamilies(),
    })
    .filter((e: Entity) => e !== targetEntity && e !== attacker) as Entity[];
  return entities;
}

function enderEffects(entity: Entity) {
  world.playSound("mob.endermen.portal", entity.location, {
    volume: 2.0,
    pitch: 1.25,
  });
  for (let k = 0; k < 30; k++) {
    entity?.dimension.spawnParticle(
      "minecraft:end_chest",
      addVector3(entity.location, randomVector3(1)),
    );
  }
}
