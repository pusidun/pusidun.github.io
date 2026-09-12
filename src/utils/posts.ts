import type { CollectionEntry } from 'astro:content';

// Pinning changes discovery order; article dates remain the publication dates.
export function comparePostsForListing(a: CollectionEntry<'blog'>, b: CollectionEntry<'blog'>) {
  return Number(b.data.pinned) - Number(a.data.pinned)
    || b.data.date.valueOf() - a.data.date.valueOf()
    || a.id.localeCompare(b.id);
}
