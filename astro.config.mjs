import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

/** The in-article code blocks and the home hero's code window used to be two
 *  unrelated themes. Both now run the same --code-* ramp from global.css, which
 *  also lets .prose pre drop its `background: ... !important` override. */
const codeTheme = {
  name: 'pusidun-dark',
  type: 'dark',
  colors: { 'editor.background': '#181715', 'editor.foreground': '#d6d3cb' },
  settings: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#6f6b62', fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'storage.type', 'keyword.control', 'variable.language'], settings: { foreground: '#d68f6f' } },
    { scope: ['string', 'string.quoted', 'constant.character', 'meta.preprocessor.string'], settings: { foreground: '#93b8a6' } },
    { scope: ['constant.numeric', 'constant.language', 'constant.other'], settings: { foreground: '#d9b168' } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call'], settings: { foreground: '#9fb4c9' } },
    { scope: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class'], settings: { foreground: '#d9b168' } },
    { scope: ['punctuation', 'meta.brace', 'keyword.operator'], settings: { foreground: '#8e8b82' } },
    { scope: ['variable', 'variable.other', 'meta.definition.variable'], settings: { foreground: '#d6d3cb' } },
    { scope: ['entity.name.tag'], settings: { foreground: '#d68f6f' } },
    { scope: ['entity.other.attribute-name'], settings: { foreground: '#9fb4c9' } },
  ],
};

export default defineConfig({
  site: 'https://pusidun.github.io',
  integrations: [svelte()],
  markdown: {
    shikiConfig: {
      theme: codeTheme,
      wrap: false,
    },
  },
});
