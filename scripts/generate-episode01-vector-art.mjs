import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const checkOnly = process.argv.includes('--check');
const base = path.join(root, 'public/assets/episode01');

const defs = `<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#bfe8fb"/><stop offset="1" stop-color="#edf8fc"/></linearGradient>
<linearGradient id="blue" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2f86b8"/><stop offset="1" stop-color="#1f587d"/></linearGradient>
<linearGradient id="orange" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f39a34"/><stop offset="1" stop-color="#c25d22"/></linearGradient>
<linearGradient id="green" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#65ad7a"/><stop offset="1" stop-color="#377c54"/></linearGradient>
<linearGradient id="navy" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#536f8e"/><stop offset="1" stop-color="#2f435d"/></linearGradient>
<filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#16344b" flood-opacity=".22"/></filter>
</defs>`;

const cast = {
  player: { slug:'player', female:true, helmet:'#f7f8f4', stripe:'#2f86b8', body:'url(#blue)', accent:'#2f86b8', prop:'tablet', face:'round' },
  kang_taesik: { slug:'kang-taesik', helmet:'#e67c23', body:'#434b52', accent:'#c86f2b', prop:'gloves', wide:true, moustache:true, stern:true },
  yoon_sungho: { slug:'yoon-sungho', helmet:'#f2c437', body:'#8a684c', accent:'#b68b42', prop:'rebar', wide:true, beard:true, stern:true },
  lee_jaehoon: { slug:'lee-jaehoon', helmet:'#f7f8f4', stripe:'#4a6e96', body:'url(#navy)', accent:'#5c82aa', prop:'plans', face:'narrow' },
  lim_junho: { slug:'lim-junho', helmet:'#f4bf2c', body:'url(#green)', accent:'#59a477', prop:'radio', face:'round' },
  choi_minseok: { slug:'choi-minseok', helmet:'#e67c23', body:'url(#orange)', accent:'#ef7b2d', prop:'batons' },
  seo_jeongmin: { slug:'seo-jeongmin', helmet:'#f7f8f4', body:'url(#navy)', accent:'#667687', prop:'clipboard', glasses:true, stern:true },
  oh_seungjae: { slug:'oh-seungjae', helmet:'#f7f8f4', stripe:'#405b78', body:'url(#navy)', accent:'#405b78', prop:'phone', wide:true, stern:true },
};

const helmet = (cx, cy, rx, c, stripe='') => `<g filter="url(#shadow)"><path d="M${cx-rx},${cy+28}C${cx-rx},${cy-30} ${cx-48},${cy-66} ${cx},${cy-70}C${cx+48},${cy-66} ${cx+rx},${cy-30} ${cx+rx},${cy+28}Z" fill="${c}"/><rect x="${cx-rx-10}" y="${cy+20}" width="${rx*2+20}" height="26" rx="13" fill="${c}"/>${stripe?`<rect x="${cx-rx+12}" y="${cy+9}" width="${rx*2-24}" height="10" rx="5" fill="${stripe}"/>`:''}</g>`;

function portrait(c) {
  const skin='#d89c74', hair='#27323c';
  const fw=c.face==='narrow'?122:c.face==='round'?138:132, fx=256-fw/2;
  const torsoX=c.wide?136:158, torsoW=c.wide?240:196;
  const prop = {
    tablet:`<g transform="translate(346 362) rotate(8)"><rect width="80" height="108" rx="10" fill="#1f2c39"/><rect x="8" y="10" width="64" height="80" rx="5" fill="#8fd0e8"/></g>`,
    plans:`<g transform="translate(348 362) rotate(-8)"><rect width="86" height="106" rx="9" fill="#f7f0d7" stroke="#51667a" stroke-width="5"/><path d="M14 25h58M14 45h38M14 65h48" stroke="#7ba1b8" stroke-width="5"/></g>`,
    radio:`<g transform="translate(354 365)"><rect width="54" height="90" rx="10" fill="#273946"/><rect x="9" y="15" width="36" height="24" rx="4" fill="#92d0c8"/><path d="M42 0v-28" stroke="#273946" stroke-width="7"/></g>`,
    batons:`<g stroke="#e64f39" stroke-width="18" stroke-linecap="round"><path d="M120 414l-48-70"/><path d="M392 414l48-70"/></g>`,
    clipboard:`<g transform="translate(346 358)"><rect width="82" height="114" rx="7" fill="#d7b474" stroke="#4d5965" stroke-width="5"/><path d="M15 30h52M15 50h52M15 70h38" stroke="#f4ead1" stroke-width="5"/></g>`,
    phone:`<g transform="translate(360 350) rotate(-8)"><rect width="42" height="82" rx="10" fill="#26384a"/><rect x="5" y="8" width="32" height="58" rx="6" fill="#6fb0cf"/></g>`,
    rebar:`<g stroke="#59646a" stroke-width="12" stroke-linecap="round"><path d="M354 370l70 100"/><path d="M374 354l70 100"/></g>`,
    gloves:`<path d="M382 380q35 18 42 51q-28 18-55-3q-6-25 13-48Z" fill="#d88a35" stroke="#6b4a2f" stroke-width="5"/>`,
  }[c.prop] ?? '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${defs}<rect width="512" height="512" rx="58" fill="#eaf6fb"/><circle cx="256" cy="246" r="192" fill="#dff0f7" stroke="#b7d5e4" stroke-width="4"/>${c.female?`<path d="M180 218Q194 160 256 158Q322 164 334 224L328 302Q306 336 284 316L182 300Q164 270 180 218Z" fill="${hair}"/>`:`<path d="M194 206Q210 168 256 165Q305 168 320 209L307 236L204 236Z" fill="${hair}"/>`}<ellipse cx="${fx-2}" cy="252" rx="16" ry="27" fill="${skin}"/><ellipse cx="${fx+fw+2}" cy="252" rx="16" ry="27" fill="${skin}"/><rect x="${fx}" y="178" width="${fw}" height="156" rx="${c.face==='round'?68:52}" fill="${skin}"/><ellipse cx="224" cy="238" rx="8" ry="10" fill="#263746"/><ellipse cx="288" cy="238" rx="8" ry="10" fill="#263746"/><path d="M208 220q16-10 32-1M272 219q17-9 32 2" fill="none" stroke="${hair}" stroke-width="7" stroke-linecap="round"/><path d="M256 244q-9 22 4 24" fill="none" stroke="#a56d51" stroke-width="5" stroke-linecap="round"/>${c.stern?`<path d="M232 290q24 4 48 0" fill="none" stroke="#8a5444" stroke-width="7" stroke-linecap="round"/>`:`<path d="M228 286q28 22 56 0" fill="none" stroke="#8a5444" stroke-width="7" stroke-linecap="round"/>`}${c.moustache?`<path d="M232 272q20-15 24 2q6-17 25 0q-20 20-49-2Z" fill="#47352d"/>`:''}${c.beard?`<path d="M213 280q43 45 86 0q-7 48-43 52q-35-5-43-52Z" fill="#68483b" opacity=".42"/>`:''}${c.glasses?`<g fill="none" stroke="#263746" stroke-width="6"><rect x="204" y="224" width="46" height="30" rx="10"/><rect x="262" y="224" width="46" height="30" rx="10"/><path d="M250 238h12"/></g>`:''}<rect x="231" y="314" width="50" height="46" rx="18" fill="${skin}"/><path d="M${torsoX} 492L${torsoX+12} 398Q256 338 ${torsoX+torsoW-12} 398L${torsoX+torsoW} 492Z" fill="${c.body}" filter="url(#shadow)"/><path d="M${torsoX+18} 420H${torsoX+torsoW-18}" stroke="#f1efb8" stroke-width="14" opacity=".9"/>${helmet(256,145,93,c.helmet,c.stripe)}${prop}<circle cx="174" cy="414" r="15" fill="${c.accent}" stroke="#fff" stroke-width="4"/></svg>`;
}

function mapSprite(c) {
  const skin='#d89c74', hair='#27323c', x=c.wide?86:100, w=c.wide?148:120;
  const prop={
    tablet:`<g transform="translate(210 288) rotate(10)"><rect width="52" height="72" rx="7" fill="#1e2d39"/><rect x="6" y="7" width="40" height="51" rx="4" fill="#88c9e1"/></g>`,
    plans:`<g transform="translate(224 300) rotate(-18)"><rect width="55" height="78" rx="7" fill="#f7f0d7" stroke="#526779" stroke-width="4"/><path d="M9 19h37M9 34h28M9 49h35" stroke="#7ba1b8" stroke-width="4"/></g>`,
    radio:`<g transform="translate(230 270)"><rect width="38" height="60" rx="7" fill="#273946"/><path d="M31 0v-20" stroke="#273946" stroke-width="5"/></g>`,
    clipboard:`<g transform="translate(208 290)"><rect width="54" height="76" rx="5" fill="#d5b16f" stroke="#4f5a64" stroke-width="4"/><path d="M10 20h34M10 35h34M10 50h25" stroke="#f5ead1" stroke-width="4"/></g>`,
    phone:`<rect x="245" y="188" width="28" height="50" rx="7" fill="#26384a"/>`,
    rebar:`<g stroke="#59646a" stroke-width="9"><path d="M232 272l58 115"/><path d="M247 264l58 115"/></g>`,
    gloves:`<path d="M224 305q28 6 36 30q-21 15-43 0q-7-16 7-30Z" fill="#d88a35"/>`,
  }[c.prop] ?? '';
  const arms=c.prop==='batons'?`<path d="M105 258L48 190M215 258L272 190" stroke="${skin}" stroke-width="24" stroke-linecap="round"/><path d="M49 188L22 142M271 188l27-46" stroke="#e6533d" stroke-width="14" stroke-linecap="round"/>`:`<path d="M105 260L78 330M215 260L248 325" stroke="${skin}" stroke-width="24" stroke-linecap="round"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="480" viewBox="0 0 320 480">${defs}<ellipse cx="160" cy="444" rx="86" ry="20" fill="#1d4d65" opacity=".15"/><path d="M132 328L104 432h38l22-104Z" fill="#34495e"/><path d="M188 328l28 104h-38l-22-104Z" fill="#2d4154"/><path d="M79 428h64v28H70q-8-18 9-28Z" fill="#26343f"/><path d="M177 428h64q17 10 9 28h-73Z" fill="#26343f"/><path d="M${x} 300Q${x+8} 235 160 228Q${x+w-8} 235 ${x+w} 300L${x+w-8} 352H${x+8}Z" fill="${c.body}" filter="url(#shadow)"/><path d="M${x+8} 286H${x+w-8}" stroke="#f0edb2" stroke-width="10"/>${arms}${prop}<rect x="143" y="206" width="34" height="38" rx="12" fill="${skin}"/><ellipse cx="160" cy="164" rx="53" ry="61" fill="${skin}"/>${c.female?`<path d="M109 161q10-70 51-70q48 4 53 77l-18 30q-16-70-70-7Z" fill="${hair}"/>`:`<path d="M112 148q15-57 48-57q41 3 50 58l-18 13q-18-34-63 0Z" fill="${hair}"/>`}<circle cx="140" cy="166" r="5" fill="#263746"/><circle cx="180" cy="166" r="5" fill="#263746"/><path d="M145 192q15 10 30 0" fill="none" stroke="#8a5444" stroke-width="5" stroke-linecap="round"/>${c.moustache?`<path d="M145 183q10-9 15 2q5-10 16 0q-14 10-31-2Z" fill="#47352d"/>`:''}${c.glasses?`<g fill="none" stroke="#263746" stroke-width="4"><rect x="128" y="155" width="25" height="18" rx="6"/><rect x="167" y="155" width="25" height="18" rx="6"/><path d="M153 163h14"/></g>`:''}${helmet(160,116,63,c.helmet,c.stripe)}</svg>`;
}

function mapBackground() {
  const floors=[425,505,585,665].map(y=>`<path d="M764 ${y}H1315" stroke="#f28c22" stroke-width="10"/><path d="M610 ${y-85}L764 ${y}" stroke="#d37820" stroke-width="8"/>`).join('');
  const columns=[815,905,995,1085,1175,1265].map(x=>`<path d="M${x} 372V716" stroke="#9db3bd" stroke-width="13"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">${defs}<rect width="1920" height="1080" fill="url(#sky)"/><path d="M0 640L1920 610V1080H0Z" fill="#cbb17e"/><path d="M0 900L600 720L1030 810L1540 630L1920 690V885L1510 820L1060 1040L580 930L0 1060Z" fill="#717b7c"/><path d="M40 935L595 772L1035 858L1552 678L1870 724" fill="none" stroke="#eef0d0" stroke-width="12" stroke-dasharray="46 34" opacity=".82"/><g filter="url(#shadow)"><path d="M610 285L1160 285L1315 370L764 370Z" fill="#edf4f3"/><path d="M764 370H1315V720H764Z" fill="#d2dddf"/><path d="M610 285L764 370V720L610 635Z" fill="#b9c8cc"/>${floors}${columns}</g><g filter="url(#shadow)"><path d="M1390 440L1660 440L1750 500L1480 500Z" fill="#edf4f3"/><path d="M1480 500H1750V760H1480Z" fill="#cbd9dc"/><path d="M1390 440L1480 500V760L1390 700Z" fill="#afc0c4"/></g><g stroke="#d17a12" fill="none"><path d="M1360 145V610" stroke-width="30"/><path d="M1020 170H1690" stroke-width="24"/><path d="M1360 145l-165 25M1360 145l130 25" stroke-width="12"/><path d="M1575 176v225" stroke-width="6"/></g><rect x="1557" y="398" width="36" height="40" rx="5" fill="#d17a12"/><rect x="120" y="570" width="260" height="130" rx="18" fill="#eef4ef" stroke="#607581" stroke-width="8"/><rect x="190" y="610" width="120" height="90" fill="#92c5d9"/><path d="M80 870V690H390V870" fill="none" stroke="#476a79" stroke-width="15"/><g fill="#ef8b21">${[520,580,640,1210,1280,1350,1610,1680].map(x=>`<path d="M${x} 840l22 44h-44Z"/>`).join('')}</g></svg>`;
}

const planned=[];
for (const c of Object.values(cast)) {
  planned.push([`characters/${c.slug}-portrait.svg`, portrait(c)]);
  planned.push([`characters/${c.slug}-map.svg`, mapSprite(c)]);
}
planned.push(['backgrounds/foundation-map.svg', mapBackground()]);

let mismatches=0;
for (const [relative, content] of planned) {
  const target=path.join(base, relative);
  await mkdir(path.dirname(target), { recursive:true });
  if (checkOnly) {
    try { if (await readFile(target,'utf8') !== content) mismatches++; } catch { mismatches++; }
  } else await writeFile(target, content, 'utf8');
}
if (checkOnly) {
  if (mismatches) { console.error(`Episode 01 vector art is out of date (${mismatches} files). Run: npm run assets:vector`); process.exitCode=1; }
  else console.log(`Episode 01 vector art is current (${planned.length} files).`);
} else console.log(`Wrote ${planned.length} Episode 01 vector art files.`);
