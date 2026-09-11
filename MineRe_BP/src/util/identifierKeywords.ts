/** Splits an identifier path into lowercase words. */
export function getIdentifierKeywords(identifier: string): Set<string> {
  return new Set(
    (identifier.split(":")[1] ?? identifier)
      .toLowerCase()
      .split(/[_-]+/)
      .filter(Boolean),
  );
}

/** Returns true when every required word is present in an identifier. */
export function hasIdentifierKeywords(
  identifier: string,
  requiredKeywords: string[],
): boolean {
  const keywords = getIdentifierKeywords(identifier);
  return requiredKeywords.every((keyword) =>
    keywords.has(keyword.toLowerCase()),
  );
}

/** Returns true when at least one of the supplied words is present. */
export function hasAnyIdentifierKeyword(
  identifier: string,
  candidateKeywords: string[],
): boolean {
  const keywords = getIdentifierKeywords(identifier);
  return candidateKeywords.some((keyword) =>
    keywords.has(keyword.toLowerCase()),
  );
}
