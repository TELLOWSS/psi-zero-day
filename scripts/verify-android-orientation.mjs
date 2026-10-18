// Static manifest guard. A passing result does not replace physical-device QA.
import { readFile } from 'node:fs/promises';
const manifest=await readFile('android/app/src/main/AndroidManifest.xml','utf8');
const activity=manifest.match(/<activity\b(?=[^>]*android:name="\.MainActivity")([^>]+)>/s)?.[1];
if(!activity)throw Error('Android MainActivity missing');
const orientation=activity.match(/android:screenOrientation="([^"]+)"/)?.[1];
if(orientation!=='fullUser')throw Error('Android app orientation must respect device rotation setting (fullUser); found '+orientation);
const changes=activity.match(/android:configChanges="([^"]+)"/)?.[1]??'';
for(const token of ['orientation','screenSize']) if(!changes.split('|').includes(token)) throw Error('MainActivity configChanges missing '+token);
const script=await readFile('scripts/configure-android.mjs','utf8');
if(!script.includes('android:screenOrientation="fullUser"'))throw Error('android:sync postprocessor would overwrite fullUser policy');
const gradle=await readFile('android/app/build.gradle','utf8');
if(!/debug\s*\{[\s\S]*?applicationIdSuffix\s+"\.qa"/.test(gradle))throw Error('Director debug APK must have separate com.tellowss.psizeroday.qa id');
console.log('PASS Android portrait/landscape manifest policy (fullUser), rotation + screenSize handling; debug APK isolated from production save; physical device QA remains pending.');
