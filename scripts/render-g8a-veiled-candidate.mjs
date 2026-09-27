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
.worker{position:absolute;left:825px;top:70px;width:560px;height:auto;z-index:2;
  filter:brightness(.74) saturate(.78) contrast(1.03) drop-shadow(0 18px 24px rgba(0,0,0,.34))}
.stack{position:absolute;left:145px;top:315px;width:1030px;height:auto;z-index:4;
  filter:brightness(.78) saturate(.82) contrast(1.08) drop-shadow(0 20px 28px rgba(0,0,0,.42))}
.barrier{position:absolute;left:665px;top:705px;width:760px;height:auto;z-index:5;
  filter:brightness(.74) saturate(.72) contrast(1.08) drop-shadow(0 15px 18px rgba(0,0,0,.36))}
.shadow{position:absolute;left:430px;top:130px;width:690px;height:650px;z-index:6;
  background:linear-gradient(118deg,rgba(4,8,10,.70) 0 34%,rgba(12,15,16,.35) 49%,rgba(12,15,16,0) 73%);
  clip-path:polygon(0 0,72% 7%,100% 88%,18% 100%);filter:blur(12px);opacity:.66}
.dust-a,.dust-b,.dust-c{position:absolute;border-radius:50%;z-index:7;mix-blend-mode:screen;pointer-events:none}
.dust-a{left:520px;top:240px;width:760px;height:520px;
  background:radial-gradient(ellipse at 44% 55%,rgba(188,177,153,.38),rgba(139,129,111,.17) 42%,transparent 72%);filter:blur(24px)}
.dust-b{left:690px;top:80px;width:520px;height:420px;
  background:radial-gradient(ellipse at 52% 58%,rgba(110,128,132,.22),rgba(68,78,82,.09) 48%,transparent 76%);filter:blur(28px)}
.dust-c{left:250px;top:560px;width:820px;height:330px;
  background:radial-gradient(ellipse at 58% 42%,rgba(168,142,105,.25),rgba(118,93,67,.10) 48%,transparent 78%);filter:blur(22px)}
.light{position:absolute;left:970px;top:80px;width:520px;height:520px;z-index:3;border-radius:50%;
  background:radial-gradient(circle,rgba(255,188,92,.22),rgba(255,188,92,.07) 36%,transparent 68%);filter:blur(22px)}
.cut{position:absolute;inset:0;z-index:8;background:
  linear-gradient(180deg,transparent 0 82%,rgba(11,14,15,.12) 100%),
  radial-gradient(ellipse at 52% 56%,transparent 0 54%,rgba(0,0,0,.16) 82%,rgba(0,0,0,.28) 100%);
  pointer-events:none}
</style>
<div class="scene">
  <div class="light"></div>
  <img class="worker" src="${worker}">
  <img class="stack" src="${stack}">
  <img class="barrier" src="${barrier}">
  <div class="shadow"></div>
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
