import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
const result=buildSync({entryPoints:['src/domain/psi-operator-profile.ts'],bundle:true,write:false,platform:'browser',format:'iife',globalName:'PSIOperatorProfile',target:'es2020',legalComments:'none',banner:{js:'/* Generated from src/domain/psi-operator-profile.ts; run node scripts/build-signal-breaker-operator-profile.mjs --write */'}});
const content=result.outputFiles[0].text+'\n(function(root){root.PSIOperatorProfile=PSIOperatorProfile;if(typeof module===\"object\"&&module.exports)module.exports=PSIOperatorProfile;})(typeof window!==\"undefined\"?window:globalThis);\n';
const target='public/signal-breaker-dev/src/operator-profile.js';
if(process.argv.includes('--write'))fs.writeFileSync(target,content);
assert.equal(fs.readFileSync(target,'utf8'),content,'Operator runtime bundle is stale');
console.log('PASS operator profile runtime matches the pure TypeScript contract');
