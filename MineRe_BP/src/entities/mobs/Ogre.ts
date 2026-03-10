import {
  system,
  world,
  Vector3,
  Entity,
  EntityComponentTypes,
  EntityHealthComponent,
  EntityHurtAfterEvent,
  EntityVariantComponent,
  EntityDamageCause,
  Dimension,
} from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { isAlive } from "entities/utilities/common";
import { distVector3 } from "util/vector3Functions";
import { unbreakableBlocks } from "block/blockUtils";
import { DEFAULT_TICK } from "main";
import { getBlocksInRadius } from "blocks/functions/getBlocksInRadius";

type OgreVariantProperties = {
  roarCooldownSeconds: number;
  breakRadius: number;
  roarChance: number;
  roarStartEvent: string;
};

type OgreProperties = {
  typeId: string;
  roarCooldownKey: string;
  roarActivationRange: number;
  roarTimeTicks: number;
  laughDelayTicks: number;
  caveVariantValue: number;
  variant: {
    cave: OgreVariantProperties;
    green: OgreVariantProperties;
  };
};

const OGRE_PROPERTIES: OgreProperties = {
  typeId: "minere:ogre",
  roarCooldownKey: "roarCooldown",
  roarActivationRange: 5,
  roarTimeTicks: 25,
  laughDelayTicks: 3,
  caveVariantValue: 1,
  variant: {
    cave: {
      roarCooldownSeconds: 6,
      roarChance: 0.33,
      breakRadius: 4,
      roarStartEvent: "minere:cave_ogre_start_roar",
    },
    green: {
      roarCooldownSeconds: 8,
      roarChance: 0.25,
      breakRadius: 3,
      roarStartEvent: "minere:ogre_start_roar",
    },
  },
};

export class Ogre extends BaseCustomEntity {
  constructor() {
    super(OGRE_PROPERTIES.typeId);
  }

  onEntityHurtEntity = (data: EntityHurtAfterEvent): void => {
    const ogre = data.damageSource?.damagingEntity;
    const target = data.hurtEntity;
    if (!isAlive(ogre)) {
      return;
    }
    const isTargetAlive = isAlive(target);

    const variant: OgreVariantProperties = isCaveOgre(ogre)
      ? OGRE_PROPERTIES.variant.cave
      : OGRE_PROPERTIES.variant.green;

    // trigger roar attack
    if (isTargetAlive) {
      rollOgreRoar(
        ogre,
        target,
        variant,
        target.typeId === "minecraft:player",
      );
    }

    // laugh on kill
    if (!isTargetAlive) {
      system.runTimeout(() => {
        if (!ogre?.isValid) {
          return;
        }
        ogre.dimension.playSound("mob.ogre.laugh", ogre.location);
      }, OGRE_PROPERTIES.laughDelayTicks);
      return;
    }
    const health = target.getComponent(
      EntityComponentTypes.Health,
    ) as EntityHealthComponent;
    if (!health || health.currentValue > 0) {
      return;
    }
    system.runTimeout(() => {
      if (!ogre?.isValid) {
        return;
      }
      ogre.dimension.playSound("mob.ogre.laugh", ogre.location);
    }, OGRE_PROPERTIES.laughDelayTicks);
  };

  onEntityHurt = (data: EntityHurtAfterEvent): void => {
    const ogre = data.hurtEntity;
    const attacker = data.damageSource?.damagingEntity;
    const variant: OgreVariantProperties = isCaveOgre(ogre)
      ? OGRE_PROPERTIES.variant.cave
      : OGRE_PROPERTIES.variant.green;
    const isSuffocation =
      data?.damageSource.cause === EntityDamageCause.suffocation;
    if (!isAlive(ogre)) {
      return;
    }
    rollOgreRoar(
      ogre,
      attacker,
      variant,
      attacker?.typeId === "minecraft:player" || isSuffocation,
      isSuffocation,
    );
  };
}

function rollOgreRoar(
  caster: Entity,
  target: Entity | undefined,
  variant: OgreVariantProperties,
  canBreakBlocks: boolean,
  force: boolean = false,
) {
  // check roar chance. Force roar if suffocating to break blocks and free itself
  if (!force && Math.random() > variant.roarChance) {
    return;
  }
  const dimension = world.getDimension(caster.dimension.id);
  if (!dimension) {
    return;
  }

  const cooldown = caster.getDynamicProperty(OGRE_PROPERTIES.roarCooldownKey);
  if (
    !!cooldown &&
    typeof cooldown == "number" &&
    system.currentTick - cooldown < variant.roarCooldownSeconds * DEFAULT_TICK
  ) {
    return;
  }
  // check if target is alive and within range. Force roar if no target (e.g. suffocating) to break blocks and free itself
  if (
    !force &&
    (!isAlive(target) ||
      distVector3(caster.location, target.location) >
        OGRE_PROPERTIES.roarActivationRange)
  ) {
    return;
  }
  caster.setDynamicProperty(
    OGRE_PROPERTIES.roarCooldownKey,
    system.currentTick,
  );
  triggerRoar(caster, variant);

  if (!canBreakBlocks) {
    return;
  }
  if (dimension.id === "minecraft:overworld" && caster.location.y > 63) {
    return;
  }
  if (caster.isInWater) {
    return;
  }
  system.runTimeout(() => {
    if (!caster?.isValid) {
      return;
    }
    breakBlocksAround(caster, dimension, variant);
  }, OGRE_PROPERTIES.roarTimeTicks);
}

function isCaveOgre(entity: Entity): boolean {
  const variant = entity.getComponent(
    EntityComponentTypes.Variant,
  ) as EntityVariantComponent;
  return variant?.value === OGRE_PROPERTIES.caveVariantValue;
}

function triggerRoar(
  entity: Entity,
  variantProps: OgreVariantProperties,
): void {
  entity.triggerEvent(variantProps.roarStartEvent);
}

function breakBlocksAround(
  caster: Entity,
  dimension: Dimension,
  variantProps: OgreVariantProperties,
): void {
  const blocks = getBlocksInRadius(
    dimension,
    caster.getHeadLocation(),
    variantProps.breakRadius,
  );

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (
      unbreakableBlocks.has(block.typeId) ||
      block.location.y <= caster.getBlockStandingOn().location.y
    ) {
      continue;
    }
    const pos = block.location;
    dimension.runCommand(`setBlock ${pos.x} ${pos.y} ${pos.z} air destroy`);
  }
}
