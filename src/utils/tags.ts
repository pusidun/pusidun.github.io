/** One comparison key for authored tags, filter buttons, and old URL values. */
export const tagKey = (tag: string) => tag.trim().toLowerCase();

export function normalizeTags(tags: string[]): string[] {
  const seen = new Map<string, string>();
  for (const raw of tags) {
    const tag = raw.trim();
    if (!tag) continue;
    const key = tagKey(tag);
    if (!seen.has(key)) seen.set(key, /^[\x20-\x7F]+$/.test(tag) ? key : tag);
  }
  return [...seen.values()];
}

/** Keep the visible spelling from the catalog, including mixed-case CJK tags. */
export function resolveTags(values: string[], available: string[]): string[] {
  const catalog = new Map(available.map(tag => [tagKey(tag), tag]));
  return [...new Set(normalizeTags(values).map(tag => catalog.get(tagKey(tag)) ?? tag))];
}
