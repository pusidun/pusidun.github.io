import { translate } from '../i18n';
export interface SearchPost { id: string; title: string; summary: string; body: string; type: string; tags: string[]; }
const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
export function buildSearchIndex(posts: SearchPost[]) {
  return new Map(posts.map(post => [post.id, normalize([post.title, post.summary, post.type, translate(post.type), ...post.tags, ...post.tags.map(tag => translate(tag)), post.body].join(' '))]));
}
export function matchesSearch(text: string, query: string): boolean {
  return normalize(query).split(' ').filter(Boolean).every(word => text.includes(word));
}
