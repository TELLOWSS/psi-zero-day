import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const chrome = process.env.CHROME_BIN || 'google-chrome';
const out = resolve('public/assets/defense/enemies/veiled-final-g8a-candidate.webp');
mkdirSync(resolve('public/assets/defense/enemies'), { recursive: true });

function dataUrl(file, mime='image/webp') {
  return `data:${mime};base64,${readFileSync(resolve(file)).toString('base64')}`;
}

const worker = dataUrl('public/assets/episode01/characters/kang-taesik-map.webp');
const stack = dataUrl('public/assets/episode01/scene-elements/material-stack-realistic-v2.webp');

const html = `<!doctype html>
<meta charset="utf-8">
<style>
html,body{margin:0;width:1536px;height:1024px;overflow:hidden;background:transparent}
.scene{position:relative;width:1536px;height:1024px;background:transparent;isolation:isolate}
.worker{
  position:absolute;left:760px;top:155px;width:420px;height:auto;z-index:1;
  opacity:.86;
  filter:brightness(.69) saturate(.74) contrast(1.04) drop-shadow(0 14px 18px rgba(0,0,0,.40))
}
.stack-back{
  position:absolute;left:405px;top:365px;width:720px;height:auto;z-index:3;
  filter:brightness(.73) saturate(.76) contrast(1.09) drop-shadow(0 18px 26px rgba(0,0,0,.46))
}
</style>
<div class="scene">
  <img class="worker" src="${worker}">
  <img class="stack-back" src="${stack}">
</div>`

const tempHtml = resolve('/tmp/psi-veiled-g8a.html');
const tempPng = resolve('/tmp/psi-veiled-g8a.png');
writeFileSync(tempHtml, html);

execFileSync(chrome, [
  '--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
  '--allow-file-access-from-files','--force-device-scale-factor=1',
  '--default-background-color=00000000','--window-size=1536,1024',
  `--screenshot=${tempPng}`, pathToFileURL(tempHtml).href,
], { stdio: 'inherit' });

execFileSync('cwebp', ['-quiet','-q','94','-alpha_q','100','-m','6',tempPng,'-o',out], { stdio: 'inherit' });
console.log(`VEILED candidate rendered: ${out}`);
