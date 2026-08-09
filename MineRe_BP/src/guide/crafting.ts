import { RawMessage } from "@minecraft/server";

export type GuidePageText = RawMessage | string;

export function craftingIngredient(
  translationKey: string,
  amount?: number,
): RawMessage {
  const rawtext: RawMessage[] = [{ translate: translationKey }];

  if (amount && amount > 1) {
    rawtext.push({ text: ` x ${amount}` });
  }

  return { rawtext };
}

export function quantityRange(
  translationKey: string,
  minimum: number,
  maximum: number,
): RawMessage {
  return {
    rawtext: [
      { translate: translationKey },
      { text: ` x ${minimum}-${maximum}` },
    ],
  };
}

export function resolveGuidePageText(text: GuidePageText): RawMessage {
  return typeof text === "string" ? { translate: text } : text;
}
