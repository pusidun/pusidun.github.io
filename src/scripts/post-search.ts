import { translate, translateContent } from '../i18n';

/** Post bodies are deliberately absent: shipping every post's Markdown source
 *  into the island's props put ~100–200KB of text in the HTML document and grew
 *  linearly with the archive. Title, summary, type and tags are already in the
 *  props and cover the queries people actually type. */
export interface SearchPost { id: string; title: string; summary: string; type: string; tags: string[]; }

const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();

export function buildSearchIndex(posts: SearchPost[]) {
  return new Map(posts.map(post => [post.id, normalize([
    post.title,
    post.summary,
    post.type,
    translate(post.type),
    ...post.tags,
    ...post.tags.map(tag => translateContent(tag)),
  ].join(' '))]));
}

export function matchesSearch(text: string, query: string): boolean {
  const words = normalize(query).split(' ').filter(Boolean);
  if (!words.length) return true;
  return words.every(word => text.includes(word));
}
