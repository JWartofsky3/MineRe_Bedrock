import {
  world,
  system,
  EntityComponentTypes,
  EntityRidingComponent,
  PlayerInteractWithEntityAfterEvent,
  PlayerInteractWithEntityBeforeEvent,
  ItemStack,
  Entity,
  Player,
  EntityIsSaddledComponent,
  EntityDamageCause,
  EntityDieAfterEvent,
  EntityHurtAfterEvent,
  EntityInventoryComponent,
  EntityDamageSource,
  EntityIsChestedComponent,
  EntityEquippableComponent,
  EquipmentSlot,
} from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import {
  applyBombDamageBonus,
  getScaledDamage,
} from "entities/functions/applyDamageBonus";
import { isOffCooldown } from "entities/functions/checkCooldown";
import { throwEntity } from "entities/functions/throw";
import { isBaby } from "entities/utilities/common";
import { isAlive } from "mob/mob_utils";
import {
  addVector3,
  distVector3,
  multiplyVector3Number,
} from "util/vector3Functions";

const ELEPHANT_TYPE_ID = "minere:elephant";
const CARPET_PROPERTY_ID = "minere:carpet";
const ARMOR_PROPERTY_ID = "minere:armor";
const ATTACK_COOLDOWN_PROPERTY_ID = "minere:attack_cooldown";
const STOMP_COOLDOWN_PROPERTY_ID = "minere:stomp_cooldown";

const ATTACK_COOLDOWN = 20 * 1.25;
const ATTACK_RANGE = 3;
const ATTACK_DELAY = 20 * 1.0;
const MIN_DAMAGE = 12;
const MAX_DAMAGE = 24;
const TARGET_OFFSET = 1.5;
const STOMP_COOLDOWN = 20 * 8;
const STOMP_CHANCE = 0.125;
const STOMP_ACTIVATION_RANGE = 8;
const STOMP_DAMAGE_RANGE = 5;
const STOMP_DAMAGE_MIN = 6;
const STOMP_DAMAGE_MAX = 16;

const ARMOR_BONUS_DAMAGE = 6;
const ARMOR_BONUS_RANGE = 1.0;

type CarpetEntry = {
  eventName: string;
  value: number;
};

// Carpet maps
const CARPET_DATA_BY_TYPE_ID = new Map<string, CarpetEntry>([
  ["minecraft:white_carpet", { eventName: "minere:white_carpet", value: 0 }],
  ["minecraft:orange_carpet", { eventName: "minere:orange_carpet", value: 1 }],
  [
    "minecraft:magenta_carpet",
    { eventName: "minere:magenta_carpet", value: 2 },
  ],
  [
    "minecraft:light_blue_carpet",
    { eventName: "minere:light_blue_carpet", value: 3 },
  ],
  ["minecraft:yellow_carpet", { eventName: "minere:yellow_carpet", value: 4 }],
  ["minecraft:lime_carpet", { eventName: "minere:lime_carpet", value: 5 }],
  ["minecraft:pink_carpet", { eventName: "minere:pink_carpet", value: 6 }],
  ["minecraft:gray_carpet", { eventName: "minere:gray_carpet", value: 7 }],
  [
    "minecraft:light_gray_carpet",
    { eventName: "minere:light_gray_carpet", value: 8 },
  ],
  ["minecraft:cyan_carpet", { eventName: "minere:cyan_carpet", value: 9 }],
  ["minecraft:purple_carpet", { eventName: "minere:purple_carpet", value: 10 }],
  ["minecraft:blue_carpet", { eventName: "minere:blue_carpet", value: 11 }],
  ["minecraft:brown_carpet", { eventName: "minere:brown_carpet", value: 12 }],
  ["minecraft:green_carpet", { eventName: "minere:green_carpet", value: 13 }],
  ["minecraft:red_carpet", { eventName: "minere:red_carpet", value: 14 }],
  ["minecraft:black_carpet", { eventName: "minere:black_carpet", value: 15 }],
]);

const CARPET_ID_BY_VALUE = new Map<number, string>([
  [0, "minecraft:white_carpet"],
  [1, "minecraft:orange_carpet"],
  [2, "minecraft:magenta_carpet"],
  [3, "minecraft:light_blue_carpet"],
  [4, "minecraft:yellow_carpet"],
  [5, "minecraft:lime_carpet"],
  [6, "minecraft:pink_carpet"],
  [7, "minecraft:gray_carpet"],
  [8, "minecraft:light_gray_carpet"],
  [9, "minecraft:cyan_carpet"],
  [10, "minecraft:purple_carpet"],
  [11, "minecraft:blue_carpet"],
  [12, "minecraft:brown_carpet"],
  [13, "minecraft:green_carpet"],
  [14, "minecraft:red_carpet"],
  [15, "minecraft:black_carpet"],
]);

// Armor maps
const ARMOR_ID_BY_VALUE = new Map<number, string>([
  [0, "minere:copper_elephant_armor"],
  [1, "minere:iron_elephant_armor"],
  [2, "minere:gold_elephant_armor"],
  [3, "minere:diamond_elephant_armor"],
  [4, "minere:netherite_elephant_armor"],
  [5, "minere:enderon_elephant_armor"],
  [6, "minere:indigon_elephant_armor"],
]);

const ARMOR_EVENT_BY_TYPE_ID = new Map<string, string>([
  ["minere:copper_elephant_armor", "minere:copper_armor"],
  ["minere:iron_elephant_armor", "minere:iron_armor"],
  ["minere:gold_elephant_armor", "minere:gold_armor"],
  ["minere:diamond_elephant_armor", "minere:diamond_armor"],
  ["minere:netherite_elephant_armor", "minere:netherite_armor"],
  ["minere:enderon_elephant_armor", "minere:enderon_armor"],
  ["minere:indigon_elephant_armor", "minere:indigon_armor"],
]);

const INVALID_TARGET_TYPES = new Set<string>([
  "minecraft:item",
  "minecraft:xp",
  "minecraft:xp_orb",
]);

const VALID_COMMAND_ITEMS = new Set<string>([
  "minecraft:stick",
  "minecraft:blaze_rod",
  "minecraft:bone",
  "minecraft:carrot_on_a_stick",
  "minecraft:warped_fungus_on_a_stick"
]);

export class Elephant extends BaseCustomEntity {
  constructor() {
    super(ELEPHANT_TYPE_ID);
  }

  onBeforePlayerInteractWithEntity(
    data: PlayerInteractWithEntityBeforeEvent,
  ): void {
    const elephant = data.target;
    if (!isAlive(elephant)) {
      return;
    }

    const playerRiding = data.player.getComponent(
      EntityComponentTypes.Riding,
    ) as EntityRidingComponent;
    const mount = playerRiding?.entityRidingOn;
    if (mount?.id != data.target.id) {
      return;
    }

    const playerEquip = data.player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;
    const mainItem = playerEquip.getEquipment(EquipmentSlot.Mainhand);
    if (mainItem != null && !VALID_COMMAND_ITEMS.has(mainItem.typeId)) {
      return;
    }

    system.runTimeout(() => {
      this.onControlledAttack(elephant, data.player);
    });
  }

  onPlayerInteractWithEntity(data: PlayerInteractWithEntityAfterEvent): void {
    const elephant = data.target;
    if (!isAlive(elephant)) {
      return;
    }
    const carpetEntry = CARPET_DATA_BY_TYPE_ID.get(data.itemStack?.typeId);
    if (carpetEntry) {
      return this.onCarpet(data, carpetEntry);
    }

    const armorEvent = ARMOR_EVENT_BY_TYPE_ID.get(data.itemStack?.typeId);
    if (armorEvent) {
      return this.onArmor(data, armorEvent);
    }

    const isSaddled = elephant.getComponent(
      EntityComponentTypes.IsSaddled,
    ) as EntityIsSaddledComponent;
    if (isSaddled?.isValid) {
      return;
    }

    if (data.itemStack?.typeId === "minecraft:shears") {
      this.onShear(data);
    }
  }

  onEntityDie(data: EntityDieAfterEvent): void {
    const elephant = data.deadEntity;

    // drop carpet
    const carpetType = elephant.getProperty(CARPET_PROPERTY_ID) as number;
    if (carpetType > -1) {
      elephant.dimension.spawnItem(
        new ItemStack(CARPET_ID_BY_VALUE.get(carpetType)),
        elephant.location,
      );
    }

    // drop armor
    const armorType = elephant.getProperty(ARMOR_PROPERTY_ID) as number;
    if (armorType > -1) {
      elephant.dimension.spawnItem(
        new ItemStack(ARMOR_ID_BY_VALUE.get(armorType)),
        elephant.location,
      );
    }
  }

  onEntityHurtEntity(data: EntityHurtAfterEvent): void {
    throwEntity(
      data.damageSource.damagingEntity.location,
      data.hurtEntity,
      3.0,
      1.0,
    );
  }

  onEntityHurt(data: EntityHurtAfterEvent): void {
    const elephant = data.hurtEntity;
    const attacker = data?.damageSource?.damagingEntity;
    this.tryStomp(elephant, attacker);
  }

  onCarpet(data: PlayerInteractWithEntityAfterEvent, carpet: CarpetEntry) {
    const elephant = data.target;
    const carpetProp = elephant.getProperty(CARPET_PROPERTY_ID) as number;
    const item = data.itemStack;
    if (carpetProp > -1) {
      elephant.dimension.spawnItem(
        new ItemStack(CARPET_ID_BY_VALUE.get(carpetProp)),
        elephant.location,
      );
    }
    const inventory = data.player.getComponent(
      EntityComponentTypes.Inventory,
    ) as EntityInventoryComponent;
    if (item.amount > 1) {
      item.amount = item.amount - 1;
      inventory.container.setItem(data.player.selectedSlotIndex, item);
    } else {
      inventory.container.setItem(data.player.selectedSlotIndex, undefined);
    }
    elephant.dimension.playSound("armor.equip_leather", elephant.location);
    elephant.triggerEvent(carpet.eventName);
  }

  onArmor(data: PlayerInteractWithEntityAfterEvent, armorEvent: string) {
    const elephant = data.target;
    const armorProp = elephant.getProperty(ARMOR_PROPERTY_ID) as number;
    if (armorProp > -1) {
      elephant.dimension.spawnItem(
        new ItemStack(ARMOR_ID_BY_VALUE.get(armorProp)),
        elephant.location,
      );
    }
    const inventory = data.player.getComponent(
      EntityComponentTypes.Inventory,
    ) as EntityInventoryComponent;
    inventory.container.setItem(data.player.selectedSlotIndex, undefined);
    elephant.triggerEvent(armorEvent);
    elephant.dimension.playSound("armor.equip_generic", elephant.location);
  }

  onShear(data: PlayerInteractWithEntityAfterEvent) {
    const elephant = data.target;
    const dimension = elephant.dimension;

    // remove carpet
    const carpetProp = elephant.getProperty(CARPET_PROPERTY_ID) as number;
    if (carpetProp > -1) {
      dimension.spawnItem(
        new ItemStack(CARPET_ID_BY_VALUE.get(carpetProp)),
        elephant.location,
      );
      dimension.playSound("mob.sheep.shear", elephant.location);
      elephant.triggerEvent("minere:remove_carpet");
      return;
    }

    // remove armor
    const armorProp = elephant.getProperty(ARMOR_PROPERTY_ID) as number;
    if (armorProp > -1) {
      dimension.spawnItem(
        new ItemStack(ARMOR_ID_BY_VALUE.get(armorProp)),
        elephant.location,
      );
      dimension.playSound("mob.sheep.shear", elephant.location);
      elephant.triggerEvent("minere:remove_armor");
      return;
    }

    // remove chest
    const chestComponent = elephant.getComponent(
      EntityComponentTypes.IsChested,
    ) as EntityIsChestedComponent;
    const inventory = elephant.getComponent(
      EntityComponentTypes.Inventory,
    ) as EntityInventoryComponent;
    if (chestComponent?.isValid) {
      if (!inventory.isValid || inventory.container.weight == 0) {
        dimension.spawnItem(
          new ItemStack("minecraft:chest"),
          elephant.location,
        );
        dimension.playSound("mob.sheep.shear", elephant.location);
        elephant.triggerEvent("minere:on_remove_chest");
        return;
      }
    }
  }

  onControlledAttack(elephant: Entity, player: Player) {
    if (
      !isOffCooldown(elephant, ATTACK_COOLDOWN_PROPERTY_ID, ATTACK_COOLDOWN)
    ) {
      return;
    }
    elephant.setDynamicProperty(
      ATTACK_COOLDOWN_PROPERTY_ID,
      system.currentTick,
    );


    const isArmored = (elephant.getProperty(ARMOR_PROPERTY_ID) as number) > -1;
    const dimension = elephant.dimension;
    const ignoredEntities = new Set<string>();
    ignoredEntities.add(elephant.id);
    ignoredEntities.add(player.id);

    elephant.playAnimation("animation.minere.elephant.attack");
    system.runTimeout(() => {
      if (!isAlive(elephant)) {
        return;
      }

      const modifiedAttackRange =
        ATTACK_RANGE + (isArmored ? ARMOR_BONUS_RANGE : 0);

      const entityIdsSet = new Set<string>();
      // get entities at Elephant's position
      let entities = dimension.getEntities({
        location: elephant.location,
        maxDistance: modifiedAttackRange,
      });
      entities.forEach((entity) => {
        entityIdsSet.add(entity.id);
      });
      // get entities infront of Elephant
      entities = dimension.getEntities({
        location: addVector3(
          elephant.location,
          multiplyVector3Number(elephant.getViewDirection(), TARGET_OFFSET),
        ),
        maxDistance: modifiedAttackRange,
      });
      entities.forEach((entity) => {
        entityIdsSet.add(entity.id);
      });
      // get entities by target pos
      const targetPos = addVector3(
        elephant.getHeadLocation(),
        multiplyVector3Number(player.getViewDirection(), TARGET_OFFSET),
      );
      entities = dimension.getEntities({
        location: targetPos,
        maxDistance: modifiedAttackRange,
      });
      entities.forEach((entity) => {
        entityIdsSet.add(entity.id);
      });

      // damage and throw all entities
      entityIdsSet.forEach((id) => {
        if (ignoredEntities.has(id)) {
          return;
        }
        const entity = world.getEntity(id);
        if (INVALID_TARGET_TYPES.has(entity?.typeId)) {
          return;
        }
        const damage =
          MIN_DAMAGE +
          Math.random() * (MAX_DAMAGE - MIN_DAMAGE) +
          (isArmored ? ARMOR_BONUS_DAMAGE : 0);
        throwEntity(elephant.location, entity, 3.0, 4.0);
        entity.applyDamage(damage, {
          damagingEntity: elephant,
          cause: EntityDamageCause.entityAttack,
        });
      });
    }, ATTACK_DELAY);
  }

  tryStomp(elephant: Entity, attacker: Entity) {
    if (!isAlive(attacker) || !isAlive(elephant)) {
      return;
    }

    if (isBaby(elephant)) {
      return;
    }

    if (!isOffCooldown(elephant, STOMP_COOLDOWN_PROPERTY_ID, STOMP_COOLDOWN)) {
      return;
    }

    if (
      Math.random() < STOMP_CHANCE &&
      distVector3(elephant.location, attacker.location) < STOMP_ACTIVATION_RANGE
    ) {
      elephant.setDynamicProperty(
        STOMP_COOLDOWN_PROPERTY_ID,
        system.currentTick,
      );
      elephant.triggerEvent("minere:start_stomp");
      system.runTimeout(() => {
        const entities = elephant.dimension.getEntities({
          location: elephant.location,
          maxDistance: STOMP_DAMAGE_RANGE,
        });
        const damageSource: EntityDamageSource = {
          damagingEntity: elephant,
          cause: EntityDamageCause.entityAttack,
        };

        entities.forEach((entity: Entity) => {
          if (INVALID_TARGET_TYPES.has(entity?.typeId)) {
            return;
          }
          if (entity.id === elephant.id) {
            return;
          }
          if (entity.location.y > elephant.location.y + 2.5) {
            return;
          }
          applyBombDamageBonus(
            entity,
            getScaledDamage(
              distVector3(elephant.location, entity.location),
              STOMP_DAMAGE_RANGE,
              STOMP_DAMAGE_MIN,
              STOMP_DAMAGE_MAX,
              0.5,
            ),
            damageSource,
          );
        });
      }, 18);
    }
  }
}
