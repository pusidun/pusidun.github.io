import { currentLanguage, translate } from '../i18n';
import type { CareerEntry } from '../data/cv';

type Contact = { label: string; value: string; href?: string };
export type PrivateKind = 'contacts' | 'career' | 'qr';

// Obfuscation deters plaintext harvesting only. The browser can reverse it.
export function decodePayload(payload: string, key: readonly number[]): Uint8Array {
  return Uint8Array.from(atob(payload), (char, i) => char.charCodeAt(0) ^ key[i % key.length]);
}

function localized<K extends keyof HTMLElementTagNameMap>(tag: K, zh: string, en = translate(zh), className?: string) {
  const node = element(tag, currentLanguage() === 'en' ? en : zh, className);
  node.dataset.localizedEn = en;
  node.dataset.localizedZh = zh;
  return node;
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, className?: string) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

export async function renderPrivateProfile(kind: PrivateKind, target: HTMLElement): Promise<() => void> {
  // Decode in the browser on page load; keep plaintext out of server-rendered HTML.
  const { payloads, key } = await import('../data/private-profile');
  const bytes = decodePayload(payloads[kind], key);
  const fragment = document.createDocumentFragment();
  let release = () => {};

  if (kind === 'contacts') {
    const contacts: Contact[] = JSON.parse(new TextDecoder().decode(bytes));
    const list = element('dl', undefined, 'contact-list');
    for (const contact of contacts) {
      const value = element('dd');
      if (contact.href && /^(https:\/\/|mailto:)/.test(contact.href)) {
        const link = localized('a', contact.value, translate(contact.value), 'text-link');
        link.href = contact.href;
        if (contact.href.startsWith('https://')) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
        value.append(link);
      } else {
        value.append(localized('span', contact.value));
      }
      list.append(localized('dt', contact.label), value);
    }
    fragment.append(list);
  } else if (kind === 'career') {
    const career: CareerEntry[] = JSON.parse(new TextDecoder().decode(bytes));
    const list = element('ol', undefined, 'timeline');
    for (const entry of career) {
      const item = element('li');
      const details = element('div');
      const heading = element('h2');
      heading.append(localized('span', entry.companyZh || entry.company, entry.company));
      if (entry.current) heading.append(localized('span', '现在', 'Present', 'badge'));
      details.append(heading, element('p', entry.company));
      item.append(localized('div', `${entry.start} — ${entry.end}`, `${entry.start} — ${translate(entry.end)}`, 'period'), details);
      list.append(item);
    }
    fragment.append(list);
  } else {
    const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' }));
    const image = element('img');
    image.src = url;
    image.alt = translate('公众号二维码', currentLanguage());
    image.setAttribute('data-i18n-alt', '公众号二维码');
    image.width = 160;
    fragment.append(image);
    release = () => URL.revokeObjectURL(url);
  }

  target.replaceChildren(fragment);
  return () => { target.replaceChildren(); release(); };
}
