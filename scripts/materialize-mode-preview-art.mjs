import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';

const sourceDir = new URL('../content/mode-previews/', import.meta.url);
const outDir = new URL('../public/mode-previews/', import.meta.url);
const assets = [
  ['defense-coming-soon', 'defense-coming-soon.webp'],
  ['signal-watch', 'signal-watch.webp'],
];

await mkdir(outDir, { recursive: true });
const names = await readdir(sourceDir);
for (const [prefix, outName] of assets) {
  const parts = names.filter(name => name.startsWith(`${prefix}.b64.`)).sort();
  if (!parts.length) throw new Error(`Missing mode preview chunks: ${prefix}`);
  const base64 = (await Promise.all(parts.map(name => readFile(new URL(name, sourceDir), 'utf8')))).join('');
  const binary = Buffer.from(base64, 'base64');
  if (binary.length < 5000) throw new Error(`Mode preview too small: ${prefix}`);
  if (binary.subarray(0, 4).toString() !== 'RIFF' || binary.subarray(8, 12).toString() !== 'WEBP') {
    throw new Error(`Mode preview is not a valid WebP: ${prefix}`);
  }
  await writeFile(new URL(outName, outDir), binary);
  console.log(`Mode preview materialized: ${outName} (${binary.length} bytes)`);
}
