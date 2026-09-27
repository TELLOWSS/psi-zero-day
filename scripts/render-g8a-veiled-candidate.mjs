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
  position:absolute;left:820px;top:115px;width:500px;height:auto;z-index:1;
  filter:brightness(.72) saturate(.76) contrast(1.04) drop-shadow(0 15px 18px rgba(0,0,0,.38))
}
.stack-back{
  position:absolute;left:200px;top:350px;width:990px;height:auto;z-index:3;
  filter:brightness(.74) saturate(.76) contrast(1.08) drop-shadow(0 18px 26px rgba(0,0,0,.46))
}
.stack-front{
  position:absolute;left:355px;top:555px;width:735px;height:auto;z-index:5;
  filter:brightness(.68) saturate(.72) contrast(1.10) drop-shadow(0 16px 22px rgba(0,0,0,.44))
}
.dust{position:absolute;z-index:6;border-radius:50%;background:rgba(175,158,130,.20);filter:blur(10px);opacity:.55}
.d1{left:650px;top:420px;width:82px;height:54px}
.d2{left:760px;top:355px;width:58px;height:43px;opacity:.38}
.d3{left:905px;top:500px;width:74px;height:50px;opacity:.42}
.d4{left:1040px;top:390px;width:48px;height:34px;opacity:.30}
.d5{left:565px;top:610px;width:64px;height:42px;opacity:.34}
</style>
<div class="scene">
  <img class="worker" src="${worker}">
  <img class="stack-back" src="${stack}">
  <img class="stack-front" src="${stack}">
  <div class="dust d1"></div><div class="dust d2"></div><div class="dust d3"></div>
  <div class="dust d4"></div><div class="dust d5"></div>
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
