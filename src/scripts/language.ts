import { currentLanguage, formatDate, storageKey, translate, type Language } from '../i18n';

export function applyLanguage(language: Language, persist = false) {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  if (persist) {
    try { localStorage.setItem(storageKey, language); } catch { /* Storage can be disabled. */ }
  }
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(node => {
    node.textContent = translate(node.dataset.i18n || '', language);
  });
  for (const attribute of ['aria-label', 'placeholder', 'alt', 'content']) {
    document.querySelectorAll<HTMLElement>(`[data-i18n-${attribute}]`).forEach(node => {
      node.setAttribute(attribute, translate(node.getAttribute(`data-i18n-${attribute}`) || '', language));
    });
  }
  document.querySelectorAll<HTMLElement>('[data-localized-en]').forEach(node => {
    node.textContent = language === 'en' ? node.dataset.localizedEn || '' : node.dataset.localizedZh || '';
  });
  document.querySelectorAll<HTMLTimeElement>('time[data-localized-date]').forEach(node => {
    node.textContent = formatDate(node.dateTime, language);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-language-switch]').forEach(node => {
    node.setAttribute('aria-checked', String(language === 'zh'));
  });
  window.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
}

applyLanguage(currentLanguage());
document.querySelectorAll<HTMLButtonElement>('[data-language-switch]').forEach(button => {
  button.addEventListener('click', () => applyLanguage(currentLanguage() === 'en' ? 'zh' : 'en', true));
});
window.addEventListener('pageshow', () => {
  let language = currentLanguage();
  try { language = localStorage.getItem(storageKey) === 'zh' ? 'zh' : 'en'; } catch { /* Retain current language. */ }
  applyLanguage(language);
});
window.addEventListener('storage', event => {
  if (event.key === storageKey) applyLanguage(event.newValue === 'zh' ? 'zh' : 'en');
});
