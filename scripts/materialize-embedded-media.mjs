import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isWebP, webPDimensions, webPHasAlpha } from './webp-dimensions.mjs';

const root = process.cwd();
const checkOnly = process.argv.includes('--check');
const sourceDir = path.join(root, 'content/episode01/embedded-media');
const foundationTarget = path.join(root, 'public/assets/episode01/backgrounds/foundation-map.webp');
const materialStackTarget = path.join(root, 'public/assets/episode01/scene-elements/material-stack.webp');
const accessBarrierTarget = path.join(root, 'public/assets/episode01/scene-elements/access-barrier.webp');
const foundationBlindingTarget = path.join(root, 'public/assets/episode01/scene-elements/foundation-blinding-edge.webp');
const foundationRebarTarget = path.join(root, 'public/assets/episode01/scene-elements/foundation-rebar-mat.webp');

const EXPECTED = Object.freeze({
  encodedLength: 150248,
  bytes: 112686,
  width: 1920,
  height: 1080,
  sha256: 'ee9aefea829ddbdcd5883fab68144ae85759538f83b3ec5bfe4af43c7ad2d74d',
});

const MATERIAL_STACK_EXPECTED = Object.freeze({
  encodedLength: 69312,
  encodedSha256: '13a6d1119b53d2576d1956542af5eae4548e257bf427f8ed53a1bc6971503c6f',
  bytes: 51984,
  width: 768,
  height: 581,
  sha256: '88692a78c8958c697acda30f76379c577b61667422a2d2a43e6105b2016394f0',
});

const ACCESS_BARRIER_EXPECTED = Object.freeze({
  encodedLength: 74404,
  encodedSha256: 'a5e161bce8d653e53873861e4a444cef454c8c4af62d3fc3f7a7748c378bf960',
  bytes: 55802,
  width: 820,
  height: 514,
  sha256: 'acb24f74cb7976fb2a6afa4efa0534991537e192670c11f639be25875f1fa542',
});

const FOUNDATION_BLINDING_EXPECTED = Object.freeze({
  encodedLength: 34064,
  encodedSha256: 'd0cd924d0feda18d2d807e89c49aae4e7cef16ac358a3c10b48413d07250743a',
  bytes: 25546,
  width: 768,
  height: 576,
  sha256: 'f9a22a076a81769badd9cc6173c6846b0073e2f1cf1b03f692089b6b06ae4583',
});

const FOUNDATION_REBAR_EXPECTED = Object.freeze({
  encodedLength: 47704,
  encodedSha256: '2d0fe984b3a4c22a6b86fab9666a2fdf5eb71af15aec676ce2dd18fa5b536f3f',
  bytes: 35778,
  width: 768,
  height: 576,
  sha256: '503efef361fd54592b00b5862ad0e91be13e771267607def92fbebb1190c76fe',
});

const foundationSources = [
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

const materialStackSources = [
  ['01', 10000, 'c98fe8f218b30208e161a28de2c86057cdf34bbece1c6426da8c1426da53aadf'],
  ['02', 10000, '444900f8943bdb70cfc74269e9865f24e582d98a4642910efaed4f7c5f9d2807'],
  ['03', 10000, '867b94079aefaa6cd8019fd0e2c56460308487dddca5316f2cbbb7aecd0c76b6'],
  ['04', 10000, '018cd1d7b75d4b176741291795ac464191271eb89ea923acf7a9f28cea602042'],
  ['05', 10000, '590513b55d2d0707aceba177d246fe4d1886db8042573a11136d7feaa0d36c42'],
  ['06', 10000, '3234be9d2497ac8f8f86b700955f65e1f7122a7e54f8b8874d1e7ccc236e6a39'],
  ['07', 9312, 'aa22bba77413075225d23a6f035f3ad21eb899fa26b456c0f501e26fb1e88e84'],
];

const accessBarrierSources = [
  ['01', 10000, '6043aeb1afafd17486c3f53ec780494f92102ab2465163b26b13181d4291a1f7'],
  ['02', 10000, 'f593907c5bde2f1f7f4c1fd08264a9ff5aacfc4e2b09d0ffb73ed9c8db7f1ab1'],
  ['03', 10000, 'f2be09e9cec944630aedbfe713914cbc20ddbb499f86dc4160369d066e8b3ae9'],
  ['04', 10000, '5310dd3e1f03a23f597144d5b9f7adabf87cdac37f9ff2c1876697b72c59864b'],
  ['05', 10000, 'f639406480c0e13677ea8689f9d2025dc76ac8da4e2b78e91959aeaf396c04d7'],
  ['06', 10000, '1f0d9fa1168349662787ea921dc6239180f74538e312ff31bf04a2efefd50fe7'],
  ['07', 10000, 'ecff91a611fe33b32e667097e81f4f9237d7b93674b66b147b2a6f550d6cc093'],
  ['08', 4404, 'f6e7fba0239cdf5edd3e4f6024ab9e3ec060a78ae238de864088ef7c3a17ba03'],
];

const foundationBlindingSources = [
  ['01a', 8000, '63ac8b13ea39a127d01f7e90f0c5716ce223d89389c25dc8a3bfa6dcb5053d49'],
  ['01b', 8000, '441c36782d530a508ce45953a429d39b04646cd24132ea842d9fedcfb826a6b8'],
  ['02', 16000, '0c5d20f8e9c50bb336710950a53027f13a8a6a1c98404c7c5755b5fd1f5c7ddf'],
  ['03', 2064, '47d718efd9f46bd0590ac4949d3fa18034c0c25fa777923bd67081a7171f729f'],
];

const foundationRebarSources = [
  ['01', 8000, 'd32988941b2e06431dde514389c6820bc295dc12d5b86cc7d4ffd32339550108'],
  ['02a', 4000, '17664fb7605d68787e46c1b44a91020e4922ecb88a64f85c154d988631a05d8a'],
  ['02b', 4000, '32f1e2d915e753aaf29a6e236969bce66aa4a92470c71d4e83d90d1c1e08e0ef'],
  ['03', 8000, '045c9cc35dbf4dff1ec0a75b5b935cd704c9797408d9b543c42edcdff5c21451'],
  ['04', 8000, 'd62890c1ff44b80abce786e00de48cc0b0295843191769d5cf29058abf8495ff'],
  ['05', 8000, 'eadd279423480ffaf5270e664bea76c4c919318ac9839c2a6fba499f6669126e'],
  ['06', 7704, 'ad0246865ecd82bfc9a1de70b0765c54a877763efc2f6446b13d78fc04321b87'],
];

async function readEmbeddedParts(prefix, specs) {
  const parts = [];
  const mismatches = [];
  for (const [suffix, expectedLength, expectedSha] of specs) {
    const file = `${prefix}.b64.${suffix}`;
    const text = (await readFile(path.join(sourceDir, file), 'utf8')).trim();
    const actualSha = createHash('sha256').update(text).digest('hex');
    if (text.length !== expectedLength || actualSha !== expectedSha) {
      mismatches.push(`${file}: length ${text.length}/${expectedLength}, sha ${actualSha}/${expectedSha}`);
    }
    if (!/^[A-Za-z0-9+/=]+$/.test(text)) mismatches.push(`${file}: contains non-base64 characters`);
    parts.push(text);
  }
  if (mismatches.length) throw new Error(`${prefix} embedded source mismatch:\n${mismatches.join('\n')}`);
  return parts.join('');
}

async function writeIfChanged(target, bytes) {
  await mkdir(path.dirname(target), { recursive: true });
  let unchanged = false;
  try {
    const current = await readFile(target);
    unchanged = current.length === bytes.length && current.equals(bytes);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  if (!unchanged) await writeFile(target, bytes);
  return unchanged;
}

const encoded = await readEmbeddedParts('foundation-map.webp', foundationSources);
if (encoded.length !== EXPECTED.encodedLength) {
  throw new Error(`Foundation base64 length ${encoded.length}; expected ${EXPECTED.encodedLength}.`);
}
const bytes = Buffer.from(encoded, 'base64');
if (bytes.length !== EXPECTED.bytes) throw new Error(`Foundation WebP size ${bytes.length}; expected ${EXPECTED.bytes}.`);
if (!isWebP(bytes)) throw new Error('Materialized Foundation asset is not a WebP file.');
const dimensions = webPDimensions(bytes);
if (!dimensions || dimensions.width !== EXPECTED.width || dimensions.height !== EXPECTED.height) {
  throw new Error(`Foundation dimensions ${dimensions ? `${dimensions.width}x${dimensions.height}` : 'unreadable'}; expected ${EXPECTED.width}x${EXPECTED.height}.`);
}
const hash = createHash('sha256').update(bytes).digest('hex');
if (hash !== EXPECTED.sha256) throw new Error(`Foundation SHA-256 mismatch: ${hash}.`);

const materialStackEncoded = await readEmbeddedParts('material-stack.webp', materialStackSources);
if (materialStackEncoded.length !== MATERIAL_STACK_EXPECTED.encodedLength) {
  throw new Error(`Material stack base64 length ${materialStackEncoded.length}; expected ${MATERIAL_STACK_EXPECTED.encodedLength}.`);
}
const materialStackEncodedHash = createHash('sha256').update(materialStackEncoded).digest('hex');
if (materialStackEncodedHash !== MATERIAL_STACK_EXPECTED.encodedSha256) {
  throw new Error(`Material stack base64 SHA-256 mismatch: ${materialStackEncodedHash}.`);
}
const materialStackBytes = Buffer.from(materialStackEncoded, 'base64');
if (materialStackBytes.length !== MATERIAL_STACK_EXPECTED.bytes) {
  throw new Error(`Material stack WebP size ${materialStackBytes.length}; expected ${MATERIAL_STACK_EXPECTED.bytes}.`);
}
if (!isWebP(materialStackBytes)) throw new Error('Materialized material stack asset is not a WebP file.');
const materialStackDimensions = webPDimensions(materialStackBytes);
if (!materialStackDimensions
  || materialStackDimensions.width !== MATERIAL_STACK_EXPECTED.width
  || materialStackDimensions.height !== MATERIAL_STACK_EXPECTED.height) {
  throw new Error(`Material stack dimensions ${materialStackDimensions ? `${materialStackDimensions.width}x${materialStackDimensions.height}` : 'unreadable'}; expected ${MATERIAL_STACK_EXPECTED.width}x${MATERIAL_STACK_EXPECTED.height}.`);
}
if (webPHasAlpha(materialStackBytes) !== true) throw new Error('Material stack final WebP must include alpha transparency.');
const materialStackHash = createHash('sha256').update(materialStackBytes).digest('hex');
if (materialStackHash !== MATERIAL_STACK_EXPECTED.sha256) throw new Error(`Material stack SHA-256 mismatch: ${materialStackHash}.`);

const accessBarrierEncoded = await readEmbeddedParts('access-barrier.webp', accessBarrierSources);
if (accessBarrierEncoded.length !== ACCESS_BARRIER_EXPECTED.encodedLength) {
  throw new Error(`Access barrier base64 length ${accessBarrierEncoded.length}; expected ${ACCESS_BARRIER_EXPECTED.encodedLength}.`);
}
const accessBarrierEncodedHash = createHash('sha256').update(accessBarrierEncoded).digest('hex');
if (accessBarrierEncodedHash !== ACCESS_BARRIER_EXPECTED.encodedSha256) {
  throw new Error(`Access barrier base64 SHA-256 mismatch: ${accessBarrierEncodedHash}.`);
}
const accessBarrierBytes = Buffer.from(accessBarrierEncoded, 'base64');
if (accessBarrierBytes.length !== ACCESS_BARRIER_EXPECTED.bytes) {
  throw new Error(`Access barrier WebP size ${accessBarrierBytes.length}; expected ${ACCESS_BARRIER_EXPECTED.bytes}.`);
}
if (!isWebP(accessBarrierBytes)) throw new Error('Materialized access barrier asset is not a WebP file.');
const accessBarrierDimensions = webPDimensions(accessBarrierBytes);
if (!accessBarrierDimensions
  || accessBarrierDimensions.width !== ACCESS_BARRIER_EXPECTED.width
  || accessBarrierDimensions.height !== ACCESS_BARRIER_EXPECTED.height) {
  throw new Error(`Access barrier dimensions ${accessBarrierDimensions ? `${accessBarrierDimensions.width}x${accessBarrierDimensions.height}` : 'unreadable'}; expected ${ACCESS_BARRIER_EXPECTED.width}x${ACCESS_BARRIER_EXPECTED.height}.`);
}
if (webPHasAlpha(accessBarrierBytes) !== true) throw new Error('Access barrier final WebP must include alpha transparency.');
const accessBarrierHash = createHash('sha256').update(accessBarrierBytes).digest('hex');
if (accessBarrierHash !== ACCESS_BARRIER_EXPECTED.sha256) throw new Error(`Access barrier SHA-256 mismatch: ${accessBarrierHash}.`);

const foundationBlindingEncoded = await readEmbeddedParts('foundation-blinding-edge.webp', foundationBlindingSources);
if (foundationBlindingEncoded.length !== FOUNDATION_BLINDING_EXPECTED.encodedLength) {
  throw new Error(`Foundation blinding base64 length ${foundationBlindingEncoded.length}; expected ${FOUNDATION_BLINDING_EXPECTED.encodedLength}.`);
}
const foundationBlindingEncodedHash = createHash('sha256').update(foundationBlindingEncoded).digest('hex');
if (foundationBlindingEncodedHash !== FOUNDATION_BLINDING_EXPECTED.encodedSha256) {
  throw new Error(`Foundation blinding base64 SHA-256 mismatch: ${foundationBlindingEncodedHash}.`);
}
const foundationBlindingBytes = Buffer.from(foundationBlindingEncoded, 'base64');
if (foundationBlindingBytes.length !== FOUNDATION_BLINDING_EXPECTED.bytes) {
  throw new Error(`Foundation blinding WebP size ${foundationBlindingBytes.length}; expected ${FOUNDATION_BLINDING_EXPECTED.bytes}.`);
}
if (!isWebP(foundationBlindingBytes)) throw new Error('Materialized foundation blinding asset is not a WebP file.');
const foundationBlindingDimensions = webPDimensions(foundationBlindingBytes);
if (!foundationBlindingDimensions
  || foundationBlindingDimensions.width !== FOUNDATION_BLINDING_EXPECTED.width
  || foundationBlindingDimensions.height !== FOUNDATION_BLINDING_EXPECTED.height) {
  throw new Error(`Foundation blinding dimensions ${foundationBlindingDimensions ? `${foundationBlindingDimensions.width}x${foundationBlindingDimensions.height}` : 'unreadable'}; expected ${FOUNDATION_BLINDING_EXPECTED.width}x${FOUNDATION_BLINDING_EXPECTED.height}.`);
}
if (webPHasAlpha(foundationBlindingBytes) !== true) throw new Error('Foundation blinding final WebP must include alpha transparency.');
const foundationBlindingHash = createHash('sha256').update(foundationBlindingBytes).digest('hex');
if (foundationBlindingHash !== FOUNDATION_BLINDING_EXPECTED.sha256) throw new Error(`Foundation blinding SHA-256 mismatch: ${foundationBlindingHash}.`);

const foundationRebarEncoded = await readEmbeddedParts('foundation-rebar-mat.webp', foundationRebarSources);
if (foundationRebarEncoded.length !== FOUNDATION_REBAR_EXPECTED.encodedLength) {
  throw new Error(`Foundation rebar base64 length ${foundationRebarEncoded.length}; expected ${FOUNDATION_REBAR_EXPECTED.encodedLength}.`);
}
const foundationRebarEncodedHash = createHash('sha256').update(foundationRebarEncoded).digest('hex');
if (foundationRebarEncodedHash !== FOUNDATION_REBAR_EXPECTED.encodedSha256) {
  throw new Error(`Foundation rebar base64 SHA-256 mismatch: ${foundationRebarEncodedHash}.`);
}
const foundationRebarBytes = Buffer.from(foundationRebarEncoded, 'base64');
if (foundationRebarBytes.length !== FOUNDATION_REBAR_EXPECTED.bytes) {
  throw new Error(`Foundation rebar WebP size ${foundationRebarBytes.length}; expected ${FOUNDATION_REBAR_EXPECTED.bytes}.`);
}
if (!isWebP(foundationRebarBytes)) throw new Error('Materialized foundation rebar asset is not a WebP file.');
const foundationRebarDimensions = webPDimensions(foundationRebarBytes);
if (!foundationRebarDimensions
  || foundationRebarDimensions.width !== FOUNDATION_REBAR_EXPECTED.width
  || foundationRebarDimensions.height !== FOUNDATION_REBAR_EXPECTED.height) {
  throw new Error(`Foundation rebar dimensions ${foundationRebarDimensions ? `${foundationRebarDimensions.width}x${foundationRebarDimensions.height}` : 'unreadable'}; expected ${FOUNDATION_REBAR_EXPECTED.width}x${FOUNDATION_REBAR_EXPECTED.height}.`);
}
if (webPHasAlpha(foundationRebarBytes) !== true) throw new Error('Foundation rebar final WebP must include alpha transparency.');
const foundationRebarHash = createHash('sha256').update(foundationRebarBytes).digest('hex');
if (foundationRebarHash !== FOUNDATION_REBAR_EXPECTED.sha256) throw new Error(`Foundation rebar SHA-256 mismatch: ${foundationRebarHash}.`);

if (!checkOnly) {
  const foundationUnchanged = await writeIfChanged(foundationTarget, bytes);
  const materialStackUnchanged = await writeIfChanged(materialStackTarget, materialStackBytes);
  const accessBarrierUnchanged = await writeIfChanged(accessBarrierTarget, accessBarrierBytes);
  const foundationBlindingUnchanged = await writeIfChanged(foundationBlindingTarget, foundationBlindingBytes);
  const foundationRebarUnchanged = await writeIfChanged(foundationRebarTarget, foundationRebarBytes);
  console.log(`${foundationUnchanged ? 'Verified' : 'Materialized'} Foundation final WebP (${EXPECTED.width}x${EXPECTED.height}, ${EXPECTED.bytes.toLocaleString('en-US')} bytes).`);
  console.log(`${materialStackUnchanged ? 'Verified' : 'Materialized'} material stack final WebP (${MATERIAL_STACK_EXPECTED.width}x${MATERIAL_STACK_EXPECTED.height}, ${MATERIAL_STACK_EXPECTED.bytes.toLocaleString('en-US')} bytes).`);
  console.log(`${accessBarrierUnchanged ? 'Verified' : 'Materialized'} access barrier final WebP (${ACCESS_BARRIER_EXPECTED.width}x${ACCESS_BARRIER_EXPECTED.height}, ${ACCESS_BARRIER_EXPECTED.bytes.toLocaleString('en-US')} bytes).`);
  console.log(`${foundationBlindingUnchanged ? 'Verified' : 'Materialized'} foundation blinding final WebP (${FOUNDATION_BLINDING_EXPECTED.width}x${FOUNDATION_BLINDING_EXPECTED.height}, ${FOUNDATION_BLINDING_EXPECTED.bytes.toLocaleString('en-US')} bytes).`);
  console.log(`${foundationRebarUnchanged ? 'Verified' : 'Materialized'} foundation rebar final WebP (${FOUNDATION_REBAR_EXPECTED.width}x${FOUNDATION_REBAR_EXPECTED.height}, ${FOUNDATION_REBAR_EXPECTED.bytes.toLocaleString('en-US')} bytes).`);
} else {
  console.log(`Foundation embedded media source verified (sha256 ${hash}).`);
  console.log(`Material stack embedded media source verified (sha256 ${materialStackHash}).`);
  console.log(`Access barrier embedded media source verified (sha256 ${accessBarrierHash}).`);
  console.log(`Foundation blinding embedded media source verified (sha256 ${foundationBlindingHash}).`);
  console.log(`Foundation rebar embedded media source verified (sha256 ${foundationRebarHash}).`);
}
