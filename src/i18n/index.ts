import { translations } from './translations';
export type Language = 'en' | 'zh';
export const storageKey = 'pusidun-language';
export function translate(text: string, language: Language = 'en'): string {
  if (language === 'zh') return text;
  if (translations[text]) return translations[text];
  if (text.endsWith(' · pusidun')) return translate(text.slice(0, -10), language) + ' · pusidun';
  const count = text.match(/^Writing \/ (\d+) 篇文章$/);
  if (count) return `Writing / ${count[1]} posts`;
  return text;
}
export function currentLanguage(): Language {
  return typeof document !== 'undefined' && document.documentElement.lang === 'zh-CN' ? 'zh' : 'en';
}
export function formatDate(date: string | Date, language: Language = 'en'): string {
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date));
}
