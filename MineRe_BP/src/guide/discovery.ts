import {
  Entity,
  EntityComponentTypes,
  EntityDamageSource,
  EntityProjectileComponent,
  GameMode,
  Player,
  system,
  world,
} from "@minecraft/server";
import {
  getGuideDiscoveryCategory,
  setGuideDiscoveryCategory,
} from "guide/discoveryStorage";

const FORMAT_CODE = String.fromCharCode(167);

export type DiscoveryLevel = 1 | 2;
export type DiscoveryCategory = "animals" | "monsters" | "bosses";

export interface GuideCreature {
  typeId: string;
  category: DiscoveryCategory;
}

const ANIMALS = [
  "minere:bird",
  "minere:black_bear",
  "minere:butterfly",
  "minere:deer",
  "minere:eagle",
  "minere:elephant",
  "minere:firefly",
  "minere:grizzly_bear",
  "minere:monkey",
  "minere:moose",
  "minere:owl",
  "minere:queen_bee",
  "minere:rat",
  "minere:squirrel",
  "minere:whale",
] as const;

const MONSTERS = [
  "minere:biter",
  "minere:cosmic_jelly",
  "minere:demon",
  "minere:demon_skull",
  "minere:dire_wolf",
  "minere:ender_phantom",
  "minere:freeze",
  "minere:ghost",
  "minere:goblin",
  "minere:gremlin",
  "minere:lizord",
  "minere:monster_bat",
  "minere:necromancer",
  "minere:netherzord",
  "minere:ogre",
  "minere:scorpion",
  "minere:stomp",
  "minere:vampire",
  "minere:walker",
  "minere:web_spider",
  "minere:yeti",
] as const;

const BOSSES = ["minere:inferno", "minere:glacier"] as const;

export const GUIDE_CREATURES: readonly GuideCreature[] = [
  ...ANIMALS.map((typeId) => ({ typeId, category: "animals" as const })),
  ...MONSTERS.map((typeId) => ({ typeId, category: "monsters" as const })),
  ...BOSSES.map((typeId) => ({ typeId, category: "bosses" as const })),
];

export const GUIDE_DISCOVERY_TOTALS: Record<DiscoveryCategory, number> = {
  animals: 15,
  monsters: 21,
  bosses: 2,
};

const creatureCategories = new Map<string, DiscoveryCategory>([
  ...GUIDE_CREATURES.map(({ typeId, category }) => [typeId, category] as const),
]);

type DiscoveryData = Record<string, DiscoveryLevel>;

function getDiscoveryData(player: Player): DiscoveryData {
  const discoveries: DiscoveryData = {};
  for (const category of ["animals", "monsters", "bosses"] as const) {
    const categoryDiscoveries = getGuideDiscoveryCategory(player, category);
    for (const [typeId, level] of Object.entries(categoryDiscoveries)) {
      if (creatureCategories.has(typeId) && (level === 1 || level === 2)) {
        discoveries[typeId] = level;
      }
    }
  }
  return discoveries;
}

export function getDiscoveryLevel(player: Player, typeId: string): number {
  return getDiscoveryData(player)[typeId] ?? 0;
}

export function getDiscoveredCount(
  player: Player,
  category: DiscoveryCategory,
): number {
  return Object.keys(getDiscoveryData(player)).filter(
    (typeId) => creatureCategories.get(typeId) === category,
  ).length;
}

export function getGuideCreatures(
  category: DiscoveryCategory,
): readonly GuideCreature[] {
  return GUIDE_CREATURES.filter((creature) => creature.category === category);
}

function discoverEntity(
  player: Player,
  entity: Entity,
  completesEntry = false,
  defeated = false,
): void {
  if (player.getGameMode() === GameMode.Creative) {
    return;
  }

  const category = creatureCategories.get(entity.typeId);
  if (!category) return;

  const discoveryLevel: DiscoveryLevel =
    category === "animals" ? 1 : completesEntry ? 2 : 1;

  const discoveries = getDiscoveryData(player);
  const currentLevel = discoveries[entity.typeId] ?? 0;
  if (currentLevel >= discoveryLevel) return;

  discoveries[entity.typeId] = discoveryLevel;
  setGuideDiscoveryCategory(
    player,
    category,
    Object.fromEntries(
      Object.entries(discoveries).filter(
        ([typeId]) => creatureCategories.get(typeId) === category,
      ),
    ),
  );

  if (category !== "animals") {
    if (!defeated) {
      if (currentLevel === 0) {
        player.sendMessage({
          rawtext: [
            { text: "Discovered " },
            { text: `${FORMAT_CODE}b` },
            { translate: `entity.${entity.typeId}.name` },
            { text: `${FORMAT_CODE}r! It has been added to your guide.` },
          ],
        });
      } else if (currentLevel === 1 && discoveryLevel === 2) {
        player.sendMessage({
          rawtext: [
            { text: "Your guidebook entry for " },
            { text: `${FORMAT_CODE}b` },
            { translate: `entity.${entity.typeId}.name` },
            { text: `${FORMAT_CODE}r has been completed!` },
          ],
        });
      }
      return;
    }

    player.sendMessage({
      rawtext: [
        { text: "Defeated " },
        { text: `${FORMAT_CODE}b` },
        { translate: `entity.${entity.typeId}.name` },
        { text: `${FORMAT_CODE}r! See the guide for more information.` },
      ],
    });
    return;
  }

  if (currentLevel !== 0) return;

  player.sendMessage({
    rawtext: [
      { text: "Discovered " },
      { text: `${FORMAT_CODE}b` },
      { translate: `entity.${entity.typeId}.name` },
      { text: `${FORMAT_CODE}r! It has been added to your guide.` },
    ],
  });
}

function isValidEntity(entity: Entity | undefined): entity is Entity {
  return entity?.isValid ?? false;
}

function getProjectileOwner(source: EntityDamageSource): Entity | undefined {
  const projectile = source.damagingProjectile ?? source.damagingEntity;
  if (!isValidEntity(projectile)) return undefined;

  return (
    (projectile.getComponent(EntityComponentTypes.Projectile) as EntityProjectileComponent | undefined)
      ?.owner ?? undefined
  );
}

function getResponsiblePlayer(source: EntityDamageSource): Player | undefined {
  const damagingEntity = source.damagingEntity;
  if (
    isValidEntity(damagingEntity) &&
    damagingEntity.typeId === "minecraft:player"
  ) {
    return damagingEntity as Player;
  }

  const projectileOwner = getProjectileOwner(source);
  if (
    isValidEntity(projectileOwner) &&
    projectileOwner.typeId === "minecraft:player"
  ) {
    return projectileOwner as Player;
  }

  return undefined;
}

export function initializeGuideDiscovery(): void {
  world.afterEvents.entityHitEntity.subscribe(
    ({ damagingEntity, hitEntity }) => {
      if (damagingEntity.typeId === "minecraft:player") {
        discoverEntity(damagingEntity as Player, hitEntity);
      }

      if (hitEntity.typeId === "minecraft:player") {
        discoverEntity(hitEntity as Player, damagingEntity);
      }
    },
  );

  world.afterEvents.entityHurt.subscribe(({ damageSource, hurtEntity }) => {
    const attackingPlayer = getResponsiblePlayer(damageSource);
    if (attackingPlayer) discoverEntity(attackingPlayer, hurtEntity);

    const sourceEntity =
      getProjectileOwner(damageSource) ?? damageSource.damagingEntity;
    if (
      isValidEntity(hurtEntity) &&
      hurtEntity.typeId === "minecraft:player" &&
      isValidEntity(sourceEntity)
    ) {
      discoverEntity(hurtEntity as Player, sourceEntity);
    }
  });

  world.afterEvents.playerInteractWithEntity.subscribe(({ player, target }) => {
    discoverEntity(player, target, true);
  });

  world.afterEvents.entityDie.subscribe(({ damageSource, deadEntity }) => {
    const player = getResponsiblePlayer(damageSource);
    if (player) discoverEntity(player, deadEntity, true, true);
  });

  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      for (const entity of player.dimension.getEntities({
        location: player.location,
        maxDistance: 8,
      })) {
        discoverEntity(player, entity);
      }
    }
  }, 20);
}
