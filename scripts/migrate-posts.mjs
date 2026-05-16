#!/usr/bin/env node
// One-shot migration: _posts/**/*.md  ->  src/content/blog/*.md
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, '_posts');
const DST = path.join(ROOT, 'src', 'content', 'blog');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(p)));
    else if (e.name.endsWith('.md')) files.push(p);
  }
  return files;
}

function slugify(name) {
  return name
    .replace(/\.md$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

function normalizeTags(input) {
  if (Array.isArray(input)) return input;
  if (!input) return [];
  return String(input)
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function convertInlineLinks(body) {
  // <a href="URL" target="_blank">TEXT</a>  ->  [TEXT](URL)
  return body.replace(
    /<a\s+href="([^"]+)"\s+target="_blank"\s*>([\s\S]*?)<\/a>/gi,
    '[$2]($1)',
  );
}

function stripTocBlock(body) {
  // Remove auto-generated TOC blocks
  return body.replace(/<!--\s*TOC\s*-->[\s\S]*?<!--\s*\/TOC\s*-->/gi, '').trimStart();
}

async function main() {
  if (!existsSync(SRC)) {
    console.error(`No _posts directory found at ${SRC}`);
    process.exit(1);
  }
  await mkdir(DST, { recursive: true });
  const files = await walk(SRC);
  console.log(`Found ${files.length} posts to migrate.`);

  for (const file of files) {
    const raw = await readFile(file, 'utf8');
    const parsed = matter(raw);
    const oldFm = parsed.data;
    const dateMatch = path.basename(file).match(/^(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : (oldFm.date ? String(oldFm.date) : '2024-01-01');

    const oldTags = normalizeTags(oldFm.tags);
    let tags = oldTags;
    if (oldFm.categories) {
      const cats = Array.isArray(oldFm.categories) ? oldFm.categories : [oldFm.categories];
      tags = Array.from(new Set([...cats.map(String), ...oldTags]));
    }

    const newFm = {
      title: String(oldFm.title || path.basename(file).replace(/\.md$/, '')),
      date,
      type: '技术',
      tags,
    };

    let body = parsed.content;
    body = stripTocBlock(body);
    body = convertInlineLinks(body);

    const slug = `${date}-${slugify(path.basename(file).replace(/^\d{4}-\d{2}-\d{2}-/, ''))}`;
    const outPath = path.join(DST, `${slug}.md`);

    const fmYaml = [
      '---',
      `title: ${JSON.stringify(newFm.title)}`,
      `date: ${newFm.date}`,
      `type: ${newFm.type}`,
      `tags: [${newFm.tags.map((t) => JSON.stringify(t)).join(', ')}]`,
      '---',
      '',
    ].join('\n');

    await writeFile(outPath, fmYaml + body);
    console.log(`  ✓ ${path.relative(ROOT, file)}  →  ${path.relative(ROOT, outPath)}`);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
