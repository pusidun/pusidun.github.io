import { translations } from './translations';
export type Language = 'en' | 'zh';
export const storageKey = 'pusidun-language';
const hasCJK = /[\u3400-\u9fff\uf900-\ufaff]/;

/** The source language is Chinese and the default view is English, so a string
 *  added without a translations.ts entry used to render Chinese to English
 *  readers with no signal. During `astro build` that now throws: every page is
 *  server-rendered, so any missing key fails the build instead of shipping. */
function reportMissing(text: string): void {
  if (!import.meta.env.PROD || !import.meta.env.SSR) return;
  if (!hasCJK.test(text)) return; // ASCII passes through by design (tags, labels)
  throw new Error(
    `[i18n] No English translation for ${JSON.stringify(text)}. ` +
      `Add it to src/i18n/translations.ts, or pass language="zh" if it is meant to stay Chinese.`,
  );
}

export function translate(text: string, language: Language = 'en'): string {
  if (language === 'zh') return text;
  if (translations[text]) return translations[text];
  if (text.endsWith(' · pusidun')) return translate(text.slice(0, -10), language) + ' · pusidun';
  const count = text.match(/^Writing \/ (\d+) 篇文章$/);
  if (count) return `Writing / ${count[1]} posts`;
  reportMissing(text);
  return text;
}

/** Post titles, summaries, and free-form tags are content and stay in their original language in the
 *  English view by design, so they are exempt from the missing-key guard. Use
 *  this for content; use translate() for interface strings. */
export function translateContent(text: string, language: Language = 'en'): string {
  if (language === 'zh') return text;
  return translations[text] ?? text;
}
export function currentLanguage(): Language {
  return typeof document !== 'undefined' && document.documentElement.lang === 'zh-CN' ? 'zh' : 'en';
}
export function formatDate(date: string | Date, language: Language = 'en'): string {
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date));
}
