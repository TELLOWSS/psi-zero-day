import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isWebP, webPDimensions } from './webp-dimensions.mjs';

const root = process.cwd();
const checkOnly = process.argv.includes('--check');
const sourceDir = path.join(root, 'content/episode01/embedded-media');
const target = path.join(root, 'public/assets/episode01/backgrounds/foundation-map.webp');

const EXPECTED = Object.freeze({
  encodedLength: 150248,
  bytes: 112686,
  width: 1920,
  height: 1080,
  sha256: 'ee9aefea829ddbdcd5883fab68144ae85759538f83b3ec5bfe4af43c7ad2d74d',
});

const sources = [
  ['01a', 2500, '57304588009d1633a068db5f64db546a7f02adb202f08baba104e1294973809f'],
  ['01b', 2500, '05a98baae3d0a08cf924d109a6d441816e5584dace14056100735e00b929ef85'],
  ['01c', 2500, 'a7d0f3ba457e3bbe929c50c8e24bc6a5fde3bd0c9d62267c6406575d74399103'],
  ['01d', 2500, 'ad53402ff316992da97af82abd48588f403e9074a6fad6a97bac0cb6b4009c9f'],
  ['02', 10000, '07c9d1293956003ccd67675b0555746d38227f731b08bc145a92ec873cd561fb'],
  ['03', 10000, 'abca7e90d3c87c4b928c57993da7baaeef3e401b2ef6487c2bf652d4398eee03'],
  ['04', 10000, '97af98a2398cab56ea65d62eb8d4120b1b55abe03b7aee0c17e707c62e447666'],
  ['05', 10000, '1b1b8642430007e607b9fc3f030479e9a38c498d5a8166d6c98308c4cfae7dcf'],
  ['06', 10000, '7d844ebce47001e17b6de9a7c310f7e08e2002acdced273360e719672e39b2d5'],
  ['07', 10000, '8372c9437494dfebb0a6dd8f78709d9b215a229d41c124038a230bd1243f54fc'],
  ['08', 10000, '9965dec7a84f687729ace64875226ca7c1c4f4ec91bbe0bb5af5e5d2c7a79fd7'],
  ['09', 10000, '09653bbe2edefef36583f484138b6af04bedae56880411295ead31cb1f6a77d4'],
  ['10', 10000, 'c75c3fd590b79f8882b1f4edec79d8a71dff848f00c07b6544a15cb1f42b7365'],
  ['11', 10000, '0e22f60b545ec4dfe7173f2a4709a3939a4879ea890280be38fcf4fcb0c74136'],
  ['12', 10000, '53a54db60bf276c2c6e54fe1e9346f76cf49760b3b3ed1755dc833777350ca55'],
  ['13a', 2500, 'd61088bcb7f055e201dba696d85a24ed840fe08377fe451162502b63fa1b78e4'],
  ['13b', 2500, 'aeb840ff04ff957b6498329f18bd986713a30f821d714f1fdfbb80501264e873'],
  ['13c', 2500, '973996504688591f55a4d42b5980bf132f975a0a8c4133b8ba9cac8098ad7f4a'],
  ['13d', 2500, '2eca39731f4cae99e482e135bbd797bacdca8e78a3f13300c831988e6ddcca57'],
  ['14', 10000, '2402edada95b075ef89f4dc087e7544f36634f5340f3de6b955c7b15ad0493bf'],
  ['15', 10000, 'e01fffc02964e3a9fb91124890a04b2cb8c632b3b473027a06e5f4ed978751cd'],
  ['16', 248, '4b433a15ea656728d6d0c8ffe3a6addbc383ecbd2e86043a2ad0a0d5dd098510'],
];

const chunks = [];
const mismatches = [];
for (const [suffix, expectedLength, expectedSha] of sources) {
  const file = `foundation-map.webp.b64.${suffix}`;
  const text = (await readFile(path.join(sourceDir, file), 'utf8')).trim();
  const actualSha = createHash('sha256').update(text).digest('hex');
  if (text.length !== expectedLength || actualSha !== expectedSha) {
    mismatches.push(`${file}: length ${text.length}/${expectedLength}, sha ${actualSha}/${expectedSha}`);
  }
  if (!/^[A-Za-z0-9+/=]+$/.test(text)) {
    mismatches.push(`${file}: contains non-base64 characters`);
  }
  chunks.push(text);
}

if (mismatches.length) {
  throw new Error(`Foundation embedded source mismatch:\n${mismatches.join('\n')}`);
}

const encoded = chunks.join('');
if (encoded.length !== EXPECTED.encodedLength) {
  throw new Error(`Foundation base64 length ${encoded.length}; expected ${EXPECTED.encodedLength}.`);
}

const bytes = Buffer.from(encoded, 'base64');
if (bytes.length !== EXPECTED.bytes) {
  throw new Error(`Foundation WebP size ${bytes.length}; expected ${EXPECTED.bytes}.`);
}
if (!isWebP(bytes)) throw new Error('Materialized Foundation asset is not a WebP file.');

const dimensions = webPDimensions(bytes);
if (!dimensions || dimensions.width !== EXPECTED.width || dimensions.height !== EXPECTED.height) {
  throw new Error(
    `Foundation dimensions ${dimensions ? `${dimensions.width}x${dimensions.height}` : 'unreadable'}; `
    + `expected ${EXPECTED.width}x${EXPECTED.height}.`,
  );
}

const hash = createHash('sha256').update(bytes).digest('hex');
if (hash !== EXPECTED.sha256) {
  throw new Error(`Foundation SHA-256 mismatch: ${hash}.`);
}

if (!checkOnly) {
  await mkdir(path.dirname(target), { recursive: true });
  let unchanged = false;
  try {
    const current = await readFile(target);
    unchanged = current.length === bytes.length && current.equals(bytes);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  if (!unchanged) await writeFile(target, bytes);
  console.log(`${unchanged ? 'Verified' : 'Materialized'} Foundation final WebP (${EXPECTED.width}x${EXPECTED.height}, ${EXPECTED.bytes.toLocaleString('en-US')} bytes).`);
} else {
  console.log(`Foundation embedded media source verified (sha256 ${hash}).`);
}
