import {
  Entity,
  EntityComponentTypes,
  EntityDamageSource,
  EntityProjectileComponent,
  Player,
  system,
  world,
} from "@minecraft/server";

const FORMAT_CODE = String.fromCharCode(167);

export const GUIDE_DISCOVERY_PROPERTY = "minere:guide_discovery";

export type DiscoveryLevel = 1 | 2;
export type DiscoveryCategory = "animals" | "monsters" | "bosses";

export interface GuideCreature {
  typeId: string;
  category: DiscoveryCategory;
}

const ANIMALS = [
  "minere:bird", "minere:black_bear", "minere:butterfly", "minere:deer",
  "minere:eagle", "minere:elephant", "minere:firefly", "minere:grizzly_bear",
  "minere:monkey", "minere:moose", "minere:owl", "minere:queen_bee",
  "minere:rat", "minere:squirrel", "minere:whale",
] as const;

const MONSTERS = [
  "minere:biter", "minere:cosmic_jelly", "minere:demon", "minere:demon_skull",
  "minere:dire_wolf", "minere:ender_phantom", "minere:freeze", "minere:ghost",
  "minere:goblin", "minere:gremlin", "minere:lizord", "minere:monster_bat",
  "minere:necromancer", "minere:netherzord", "minere:ogre", "minere:scorpion",
  "minere:stomp", "minere:vampire", "minere:walker", "minere:web_spider",
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
  const value = player.getDynamicProperty(GUIDE_DISCOVERY_PROPERTY);
  if (typeof value !== "string") return {};

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const discoveries: DiscoveryData = {};
    for (const [typeId, level] of Object.entries(parsed)) {
      if (creatureCategories.has(typeId) && (level === 1 || level === 2)) {
        discoveries[typeId] = level;
      }
    }
    return discoveries;
  } catch {
    return {};
  }
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

export function getGuideCreatures(category: DiscoveryCategory): readonly GuideCreature[] {
  return GUIDE_CREATURES.filter((creature) => creature.category === category);
}

function discoverEntity(
  player: Player,
  entity: Entity,
  level: DiscoveryLevel,
  defeated = false,
): void {
  const category = creatureCategories.get(entity.typeId);
  if (!category) return;

  const discoveryLevel = category === "animals" || defeated ? level : 1;

  const discoveries = getDiscoveryData(player);
  const currentLevel = discoveries[entity.typeId] ?? 0;
  if (currentLevel >= discoveryLevel) return;

  discoveries[entity.typeId] = discoveryLevel;
  player.setDynamicProperty(GUIDE_DISCOVERY_PROPERTY, JSON.stringify(discoveries));

  if (category !== "animals") {
    if (!defeated) {
      if (currentLevel !== 0) return;

      player.sendMessage({
        rawtext: [
          { text: "Discovered " },
          { text: `${FORMAT_CODE}b` },
          { translate: `entity.${entity.typeId}.name` },
          { text: `${FORMAT_CODE}r! It has been added to your guide.` },
        ],
      });
      return;
    }

    player.sendMessage({
      rawtext: [
        { text: "Defeated " },
        { text: `${FORMAT_CODE}b` },
        { translate: `entity.${entity.typeId}.name` },
        { text: `${FORMAT_CODE}r! It's guide entry has been completed!` },
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

function asPlayer(entity: Entity | undefined): Player | undefined {
  return entity?.typeId === "minecraft:player" ? (entity as Player) : undefined;
}

function getResponsiblePlayer(source: EntityDamageSource): Player | undefined {
  const directPlayer = asPlayer(source.damagingEntity);
  if (directPlayer) return directPlayer;

  const projectile = source.damagingProjectile ?? source.damagingEntity;
  const projectileComponent = projectile?.getComponent(
    EntityComponentTypes.Projectile,
  ) as EntityProjectileComponent | undefined;
  return asPlayer(projectileComponent?.owner);
}

function getSourceEntity(source: EntityDamageSource): Entity | undefined {
  if (source.damagingEntity && creatureCategories.has(source.damagingEntity.typeId)) {
    return source.damagingEntity;
  }

  const projectile = source.damagingProjectile ?? source.damagingEntity;
  const projectileComponent = projectile?.getComponent(
    EntityComponentTypes.Projectile,
  ) as EntityProjectileComponent | undefined;
  return projectileComponent?.owner ?? source.damagingEntity;
}

export function initializeGuideDiscovery(): void {
  world.afterEvents.entityHitEntity.subscribe(({ damagingEntity, hitEntity }) => {
    const attackingPlayer = asPlayer(damagingEntity);
    if (attackingPlayer) discoverEntity(attackingPlayer, hitEntity, 1);

    const hitPlayer = asPlayer(hitEntity);
    if (hitPlayer) discoverEntity(hitPlayer, damagingEntity, 1);
  });

  world.afterEvents.entityHurt.subscribe(({ damageSource, hurtEntity }) => {
    const attackingPlayer = getResponsiblePlayer(damageSource);
    if (attackingPlayer) discoverEntity(attackingPlayer, hurtEntity, 1);

    const hurtPlayer = asPlayer(hurtEntity);
    const sourceEntity = getSourceEntity(damageSource);
    if (hurtPlayer && sourceEntity) {
      discoverEntity(hurtPlayer, sourceEntity, 1);
    }
  });

  world.afterEvents.playerInteractWithEntity.subscribe(({ player, target }) => {
    discoverEntity(player, target, 2);
  });

  world.afterEvents.entityDie.subscribe(({ damageSource, deadEntity }) => {
    const player = getResponsiblePlayer(damageSource);
    if (player) discoverEntity(player, deadEntity, 2, true);
  });

  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      for (const entity of player.dimension.getEntities({
        location: player.location,
        maxDistance: 8,
      })) {
        discoverEntity(player, entity, 1);
      }
    }
  }, 20);
}
