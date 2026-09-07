#!/usr/bin/env node
// Regenerates src/data/private-profile.ts — the XOR'd payloads behind /cv and /about.
//
// This is reversible obfuscation, NOT encryption or access control: anything in
// here is readable by anyone who opens devtools. It deters plaintext scraping of
// an email address and nothing more. Never put a secret in it.
//
//   node scripts/encode-private-profile.mjs \
//     --contacts private/contacts.json \
//     --career   private/career.json \
//     --qr       private/qr.jpg
//
// Any flag may be omitted; omitted kinds keep their current payload.

import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

const OUT = new URL('../src/data/private-profile.ts', import.meta.url);
const KINDS = ['contacts', 'career', 'qr'];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i]?.replace(/^--/, '');
    if (!KINDS.includes(flag)) throw new Error(`Unknown flag ${argv[i]}. Expected one of: --${KINDS.join(' --')}`);
    if (!argv[i + 1]) throw new Error(`--${flag} needs a file path`);
    args[flag] = argv[i + 1];
  }
  return args;
}

const encode = (bytes, key) =>
  Buffer.from(bytes.map((b, i) => b ^ key[i % key.length])).toString('base64');

async function currentPayloads() {
  try {
    const source = await readFile(OUT, 'utf8');
    const key = JSON.parse(source.match(/export const key = (\[[^\]]*\]);/)[1]);
    const payloads = {};
    for (const kind of KINDS) {
      const found = source.match(new RegExp(`"${kind}":\\s*"([^"]*)"`));
      if (found) payloads[kind] = Buffer.from(found[1], 'base64');
    }
    // Decode with the old key so everything can be re-encoded under a new one.
    for (const kind of Object.keys(payloads)) {
      payloads[kind] = Uint8Array.from(payloads[kind], (b, i) => b ^ key[i % key.length]);
    }
    return payloads;
  } catch {
    return {};
  }
}

const args = parseArgs(process.argv.slice(2));
if (!Object.keys(args).length) {
  console.error('Nothing to do. Pass at least one of --contacts / --career / --qr.');
  process.exit(1);
}

const plaintext = await currentPayloads();
for (const [kind, path] of Object.entries(args)) {
  const raw = await readFile(path);
  if (kind !== 'qr') JSON.parse(raw.toString('utf8')); // fail loudly on malformed JSON
  plaintext[kind] = Uint8Array.from(raw);
}

const missing = KINDS.filter(kind => !plaintext[kind]);
if (missing.length) throw new Error(`No existing payload for: ${missing.join(', ')}. Supply them explicitly.`);

const key = [...randomBytes(17)];
const body = KINDS.map(kind => `  ${JSON.stringify(kind)}: "${encode([...plaintext[kind]], key)}",`).join('\n');

await writeFile(OUT, `// Reversible client-side obfuscation, NOT encryption or access control.
// Do not import this module from server-rendered Astro frontmatter.
// Regenerate with: node scripts/encode-private-profile.mjs
export const key = ${JSON.stringify(key)};
export const payloads = {
${body}
};
`);
console.log(`Wrote ${OUT.pathname} (${KINDS.map(k => `${k}: ${plaintext[k].length}B`).join(', ')})`);
