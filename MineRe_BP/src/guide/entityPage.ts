import { Player, RawMessage } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

type EntityPageText = RawMessage | string;
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
  maxHealth: number | readonly [number, number];
  attack?: number | readonly [number, number];
  effects?: EntityPageEffect[];
  description: EntityPageText;
  itemGroups?: EntityPageItemGroup[];
  equipment?: EntityPageEquipmentGroup[];
  experience?: number | readonly [number, number];
  drops?: EntityPageDrop[];
}

/** A reusable Guide page for a creature's health, behavior, and drops. */
export class EntityPage {
  constructor(private readonly options: EntityPageOptions) {}

  show(player: Player, onBack: () => void): void {
    const {
      maxHealth,
      attack,
      effects = [],
      description,
      itemGroups = [],
      equipment = [],
      experience,
      drops = [],
    } = this.options;
    const form = new ActionFormData().title(this.options.imagePath);

    if (typeof maxHealth === "number") {
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

    if (typeof attack === "number") {
      form.label({
        translate: "guide.minere.entity.attack",
        with: [VANILLA_HEART, attack.toString()],
      });
    } else if (attack) {
      form.label({
        translate: "guide.minere.entity.attack_range",
        with: [VANILLA_HEART, attack[0].toString(), attack[1].toString()],
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
