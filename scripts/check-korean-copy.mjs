import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const roots = [
  path.join(root, 'content', 'localization'),
  path.join(root, 'content', 'episode01'),
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

const candidates = [];
for (const dir of roots) {
  for (const file of await walk(dir)) {
    const base = path.basename(file);
    const isKo = base === 'ko.json' || base.endsWith('-ko.json');
    if (isKo) candidates.push(file);
  }
}

const problems = [];
let stringCount = 0;

function inspectString(file, keyPath, value) {
  stringCount += 1;
  const label = `${path.relative(root, file)}:${keyPath}`;
  if (!value.length) problems.push(`${label}: empty string`);
  if (value !== value.trim()) problems.push(`${label}: leading/trailing whitespace`);
  if (value.includes('\uFFFD') || value.includes('�')) problems.push(`${label}: Unicode replacement character`);
  if (/[\u200B-\u200D\u2060\uFEFF]/u.test(value)) problems.push(`${label}: zero-width/invisible character`);
  if (/[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/u.test(value)) problems.push(`${label}: isolated Hangul jamo`);
  if (value.normalize('NFC') !== value) problems.push(`${label}: text is not NFC-normalized`);
}

function visit(file, value, keyPath = '$') {
  if (typeof value === 'string') {
    inspectString(file, keyPath, value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => visit(file, item, `${keyPath}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) visit(file, child, `${keyPath}.${key}`);
  }
}

for (const file of candidates.sort()) {
  let parsed;
  try {
    parsed = JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    problems.push(`${path.relative(root, file)}: invalid JSON (${error.message})`);
    continue;
  }
  visit(file, parsed);
}

if (problems.length) {
  console.error(`Korean copy integrity check FAILED (${problems.length} issue${problems.length === 1 ? '' : 's'}).`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exitCode = 1;
} else {
  console.log(`Korean copy integrity check passed: ${candidates.length} catalogs, ${stringCount} strings.`);
  console.log('Production rule: Korean UI text is rendered from localization data, not baked into generated art.');
}
