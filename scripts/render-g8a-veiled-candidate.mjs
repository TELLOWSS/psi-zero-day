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
const barrier = dataUrl('public/assets/episode01/scene-elements/access-barrier.webp');

const html = `<!doctype html>
<meta charset="utf-8">
<style>
html,body{margin:0;width:1536px;height:1024px;overflow:hidden;background:transparent}
body{font-family:sans-serif}
.scene{position:relative;width:1536px;height:1024px;background:transparent;isolation:isolate}
.worker{position:absolute;left:760px;top:115px;width:525px;height:auto;z-index:2;
  filter:brightness(.68) saturate(.72) contrast(1.04) drop-shadow(0 16px 20px rgba(0,0,0,.34))}
.stack{position:absolute;left:170px;top:285px;width:1100px;height:auto;z-index:4;
  filter:brightness(.76) saturate(.78) contrast(1.08) drop-shadow(0 18px 26px rgba(0,0,0,.42))}
.barrier{position:absolute;left:735px;top:760px;width:650px;height:auto;z-index:6;
  filter:brightness(.72) saturate(.68) contrast(1.08) drop-shadow(0 13px 16px rgba(0,0,0,.34))}
.occlusion{position:absolute;left:635px;top:190px;width:510px;height:520px;z-index:5;border-radius:48% 52% 44% 56%;
  background:
    radial-gradient(ellipse at 34% 56%,rgba(55,58,58,.48),rgba(74,74,70,.26) 44%,rgba(96,91,81,.09) 68%,transparent 80%);
  filter:blur(22px);opacity:.88}
.dust-a,.dust-b,.dust-c{position:absolute;border-radius:50%;z-index:7;pointer-events:none}
.dust-a{left:485px;top:250px;width:760px;height:500px;
  background:radial-gradient(ellipse at 48% 56%,rgba(171,159,137,.34),rgba(132,122,105,.16) 44%,transparent 74%);filter:blur(28px)}
.dust-b{left:760px;top:160px;width:480px;height:360px;
  background:radial-gradient(ellipse at 48% 58%,rgba(109,118,118,.18),rgba(76,82,82,.07) 50%,transparent 78%);filter:blur(30px)}
.dust-c{left:260px;top:600px;width:780px;height:300px;
  background:radial-gradient(ellipse at 56% 42%,rgba(156,134,105,.20),rgba(116,96,72,.08) 50%,transparent 80%);filter:blur(24px)}
.light{position:absolute;left:1040px;top:160px;width:360px;height:360px;z-index:3;border-radius:50%;
  background:radial-gradient(circle,rgba(255,188,102,.14),rgba(255,188,102,.04) 42%,transparent 72%);filter:blur(28px)}
.cut{position:absolute;inset:0;z-index:8;background:
  linear-gradient(180deg,transparent 0 84%,rgba(11,14,15,.08) 100%),
  radial-gradient(ellipse at 52% 57%,transparent 0 58%,rgba(0,0,0,.08) 84%,rgba(0,0,0,.16) 100%);
  pointer-events:none}
</style>
<div class="scene">
  <div class="light"></div>
  <img class="worker" src="${worker}">
  <img class="stack" src="${stack}">
  <img class="barrier" src="${barrier}">
  <div class="occlusion"></div>
  <div class="dust-a"></div><div class="dust-b"></div><div class="dust-c"></div>
  <div class="cut"></div>
</div>`;

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
