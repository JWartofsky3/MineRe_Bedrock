import { Player, RawMessage } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

type EntityPageText = RawMessage | string;
type EntityPageStatValue = number | readonly [number, number];
const VANILLA_HEART = String.fromCodePoint(0xe10c);

function asGuideTranslation(text: EntityPageText): EntityPageText {
  return typeof text === "string" && text.startsWith("guide.minere.")
    ? { translate: text }
    : text;
}

export interface EntityPageDrop {
  /** Localized item name and simplified amount range, such as "1-2 Feathers". */
  text: EntityPageText;
  /** Resource-pack path without the file extension. */
  iconPath: string;
}

export interface EntityPageItemGroup {
  title: EntityPageText;
  items: EntityPageDrop[];
}

export interface EntityPageEquipmentGroup {
  title?: EntityPageText;
  items: EntityPageDrop[];
}

export interface EntityPageEffect {
  /** A colored glyph that identifies the effect. */
  glyph: string;
  effectKey: string;
  durationSeconds: number;
}

export interface EntityPageOptions {
  name: EntityPageText;
  /** Resource-pack path shared by the creature-list button and entity page. */
  imagePath: string;
  maxHealth: EntityPageStatValue;
  healthVariants?: readonly { value: number; label: string }[];
  attack?: EntityPageStatValue;
  attackVariants?: readonly {
    value: EntityPageStatValue;
    label: string;
  }[];
  effects?: EntityPageEffect[];
  description: EntityPageText;
  /** Creature forms, personalities, or roles rendered immediately after description. */
  variants?: EntityPageText[];
  /** Care categories, such as Tame, Breed, or Tame/Breed. */
  itemGroups?: EntityPageItemGroup[];
  equipment?: EntityPageEquipmentGroup[];
  /** Shared combat/utility information rendered after equipment. */
  abilities?: EntityPageText[];
  /** Shared vulnerabilities rendered after abilities. */
  weaknesses?: EntityPageText[];
  experience?: number | readonly [number, number];
  drops?: EntityPageDrop[];
  /** Additional creature details rendered immediately before spawning. */
  extra?: EntityPageText[];
  /** Spawn information is deliberately rendered as the final content section. */
  spawning?: EntityPageText[];
}

/**
 * A reusable Guide page for a creature. Content order is fixed for every page:
 * stats, description, variants, care, equipment, abilities, weaknesses, drops, extra, then spawning.
 */
export class EntityPage {
  constructor(private readonly options: EntityPageOptions) {}

  show(player: Player, onBack: () => void): void {
    const {
      maxHealth,
      healthVariants,
      attack,
      attackVariants,
      effects = [],
      description,
      variants = [],
      itemGroups = [],
      equipment = [],
      abilities = [],
      weaknesses = [],
      experience,
      drops = [],
      extra = [],
      spawning = [],
    } = this.options;
    const form = new ActionFormData().title(
      `minere_guide_entity:${this.options.imagePath}`,
    );
    const asHeartValue = (value: EntityPageStatValue): string =>
      typeof value === "number"
        ? (value / 2).toString()
        : `${value[0] / 2}-${value[1] / 2}`;

    form.header(this.options.name);

    if (healthVariants?.length === 2) {
      const hasWildTamedLabels =
        healthVariants[0].label === "guide.minere.entity.variant.wild" &&
        healthVariants[1].label === "guide.minere.entity.variant.tamed";
      form.label({
        translate: hasWildTamedLabels
          ? "guide.minere.entity.health_variants_wild_tamed"
          : "guide.minere.entity.health_variants",
        with: hasWildTamedLabels
          ? [
              VANILLA_HEART,
              (healthVariants[0].value / 2).toString(),
              (healthVariants[1].value / 2).toString(),
            ]
          : [
              VANILLA_HEART,
              (healthVariants[0].value / 2).toString(),
              healthVariants[0].label,
              (healthVariants[1].value / 2).toString(),
              healthVariants[1].label,
            ],
      });
    } else if (healthVariants) {
      for (const health of healthVariants) {
        form.label({
          translate: "guide.minere.entity.health_variant",
          with: [VANILLA_HEART, (health.value / 2).toString(), health.label],
        });
      }
    } else if (typeof maxHealth === "number") {
      form.label({
        translate: "guide.minere.entity.health",
        with: [VANILLA_HEART, (maxHealth / 2).toString()],
      });
    } else {
      form.label({
        translate: "guide.minere.entity.health_range",
        with: [
          VANILLA_HEART,
          (maxHealth[0] / 2).toString(),
          (maxHealth[1] / 2).toString(),
        ],
      });
    }

    if (attackVariants?.length === 2) {
      const hasWildTamedLabels =
        attackVariants[0].label === "guide.minere.entity.variant.wild" &&
        attackVariants[1].label === "guide.minere.entity.variant.tamed";
      form.label({
        translate: hasWildTamedLabels
          ? "guide.minere.entity.attack_variants_wild_tamed"
          : "guide.minere.entity.attack_variants",
        with: hasWildTamedLabels
          ? [
              VANILLA_HEART,
              asHeartValue(attackVariants[0].value),
              asHeartValue(attackVariants[1].value),
            ]
          : [
              VANILLA_HEART,
              asHeartValue(attackVariants[0].value),
              attackVariants[0].label,
              asHeartValue(attackVariants[1].value),
              attackVariants[1].label,
            ],
      });
    } else if (attackVariants) {
      for (const attackVariant of attackVariants) {
        form.label({
          translate: "guide.minere.entity.attack_variant",
          with: [
            VANILLA_HEART,
            asHeartValue(attackVariant.value),
            attackVariant.label,
          ],
        });
      }
    } else if (typeof attack === "number") {
      form.label({
        translate: "guide.minere.entity.attack",
        with: [VANILLA_HEART, (attack / 2).toString()],
      });
    } else if (attack) {
      form.label({
        translate: "guide.minere.entity.attack_range",
        with: [
          VANILLA_HEART,
          (attack[0] / 2).toString(),
          (attack[1] / 2).toString(),
        ],
      });
    }

    if (effects.length > 0) {
      for (const effect of effects) {
        form.label({
          translate: `guide.minere.entity.effect.${effect.effectKey}`,
          with: [effect.glyph, effect.durationSeconds.toString()],
        });
      }
    }

    form.divider();
    form.label(description);

    if (variants.length > 0) {
      form.divider();
      form.header({ translate: "guide.minere.entity.variants" });
      for (const variant of variants) {
        form.label(asGuideTranslation(variant));
      }
    }

    for (const group of itemGroups) {
      form.divider();
      form.header(asGuideTranslation(group.title));
      for (const item of group.items) {
        form.label(asGuideTranslation(item.text));
      }
    }

    if (equipment.length > 0) {
      form.divider();
      form.header({ translate: "guide.minere.entity.equipment" });
      for (const group of equipment) {
        if (group.title) {
          form.header(asGuideTranslation(group.title));
        }
        for (const item of group.items) {
          form.label(asGuideTranslation(item.text));
        }
      }
    }

    if (abilities.length > 0) {
      form.divider();
      form.header({ translate: "guide.minere.entity.abilities" });
      for (const entry of abilities) {
        form.label(asGuideTranslation(entry));
      }
    }

    if (weaknesses.length > 0) {
      form.divider();
      form.header({ translate: "guide.minere.entity.weaknesses" });
      for (const weakness of weaknesses) {
        form.label(asGuideTranslation(weakness));
      }
    }

    if (drops.length > 0) {
      form.divider();
      form.header({ translate: "guide.minere.entity.drops" });
      if (typeof experience === "number") {
        form.label({
          translate: "guide.minere.entity.drop.xp",
          with: [experience.toString()],
        });
      } else if (experience) {
        form.label({
          translate: "guide.minere.entity.drop.xp_range",
          with: [experience[0].toString(), experience[1].toString()],
        });
      }
      for (const drop of drops) {
        form.label(asGuideTranslation(drop.text));
      }
    }

    if (extra.length > 0) {
      form.divider();
      form.header({ translate: "guide.minere.entity.extra" });
      for (const entry of extra) {
        form.label(asGuideTranslation(entry));
      }
    }

    if (spawning.length > 0) {
      form.divider();
      form.header({ translate: "guide.minere.entity.spawning" });
      for (const entry of spawning) {
        form.label(asGuideTranslation(entry));
      }
    }

    form.divider();
    form.button({ translate: "guide.minere.back" });
    form
      .show(player)
      .then((response) => {
        if (!response.canceled && response.selection === 0) {
          onBack();
        }
      })
      .catch((error) => console.error("Failed to show entity page: " + error));
  }
}
