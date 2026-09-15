import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const manifestPath = path.join(process.cwd(), 'android/app/src/main/AndroidManifest.xml');
let manifest = await readFile(manifestPath, 'utf8');

const activityPattern = /<activity\b([^>]*android:name="\.MainActivity"[^>]*)>/;
const match = manifest.match(activityPattern);
if (!match) {
  throw new Error('MainActivity was not found in AndroidManifest.xml');
}

let attributes = match[1];
if (/android:screenOrientation=/.test(attributes)) {
  attributes = attributes.replace(/android:screenOrientation="[^"]*"/, 'android:screenOrientation="landscape"');
} else {
  attributes += '\n            android:screenOrientation="landscape"';
}

manifest = manifest.replace(activityPattern, `<activity${attributes}>`);
await writeFile(manifestPath, manifest, 'utf8');
console.log('Android MainActivity orientation locked to landscape.');
