#!/usr/bin/env node
/**
 * Browser integration test: local ZIP-extracted silver artwork -> SHA/size
 * audit -> IndexedDB -> real Watch-native OMEGA renderer -> clear.
 *
 * Test images are generated synthetic coloured silhouettes ONLY. They are
 * NOT AIRA, not a verified user-authored sprite and not production artwork.
 */
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {deflateRawSync} from 'node:zlib';
import {chromium} from 'playwright-core';

function crc32(data){
 let crc=0xffffffff;
 for(const byte of data){
  crc^=byte;
  for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
 }
 return (crc^0xffffffff)>>>0;
}
function zipDeflated(images){
 const locals=[],centers=[];let offset=0;
 for(const {slot,bytes} of images){
  const name=Buffer.from('game_sprites_384x512/'+slot.toLowerCase()+'-silver-review.webp');
  const payload=deflateRawSync(bytes);
  const crc=crc32(bytes);
  const loc=Buffer.alloc(30);
  loc.writeUInt32LE(0x04034b50,0);loc.writeUInt16LE(20,4);
  loc.writeUInt16LE(8,8);loc.writeUInt32LE(crc,14);
  loc.writeUInt32LE(payload.length,18);loc.writeUInt32LE(bytes.length,22);
  loc.writeUInt16LE(name.length,26);
  locals.push(loc,name,payload);
  const cen=Buffer.alloc(46);
  cen.writeUInt32LE(0x02014b50,0);cen.writeUInt16LE(20,4);
  cen.writeUInt16LE(20,6);cen.writeUInt16LE(8,10);
  cen.writeUInt32LE(crc,16);cen.writeUInt32LE(payload.length,20);
  cen.writeUInt32LE(bytes.length,24);cen.writeUInt16LE(name.length,28);
  cen.writeUInt32LE(offset,42);centers.push(cen,name);
  offset+=loc.length+name.length+payload.length;
 }
 const center=Buffer.concat(centers);
 const end=Buffer.alloc(22);
 end.writeUInt32LE(0x06054b50,0);
 end.writeUInt16LE(images.length,8);end.writeUInt16LE(images.length,10);
 end.writeUInt32LE(center.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...locals,center,end]);
}
const directions=['E','SE','S','SW','W','NW','N','NE'];
const base='http://127.0.0.1:4173';
const out=resolve('qa-omega-protocol-captures');
await mkdir(out,{recursive:true});
const dir=await mkdtemp(join(tmpdir(),'omega-silver-preview-'));
const folder=join(dir,'game_sprites_384x512');
await mkdir(folder,{recursive:true});
let browser,page,report={pass:false};
const errors=[];
try{
 const hashes={},images=[];
 for(const [i,h] of directions.entries()){
  const color=['#dd2bff','#14aacb','#ec953b','#81efb7','#f95f67','#80a6ed','#f5d877','#906eeb'][i];
  const details=Array.from({length:150},(_,k)=>
   '<rect x="'+((k*47+i*19)%375)+'" y="'+((k*83+i*13)%507)+
   '" width="6" height="5" fill="'+(k%2?'#f3eafa':'#1b1436')+'"/>').join('');
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="384" height="512">'+
    '<circle cx="'+(120+i*12)+'" cy="115" r="64" fill="'+color+'"/>'+
    '<path d="M85 205 L300 205 L340 450 L50 450 Z" fill="'+color+'"/>'+
    '<path d="M130 435 L140 501 L172 501 L190 435 M200 435 L210 501 L240 501 L250 435" stroke="'+color+'" stroke-width="20"/>'+
    details+'</svg>';
  const buf=await sharp(Buffer.from(svg)).ensureAlpha().webp({quality:72}).toBuffer();
  const filename=join(folder,h.toLowerCase()+'-silver-review.webp');
  await writeFile(filename,buf);
  hashes[h]=createHash('sha256').update(buf).digest('hex');
  images.push({slot:h,bytes:buf});
 }
 hashes.M01='f'.repeat(64);
 const zipPath=join(dir,'synthetic-eight-dir-review.zip');
 await writeFile(zipPath,zipDeflated(images));
 const roster={
  schema_version:1,stage:'review_only',production_approved:false,
  main_games:['SIGNAL GUARD','SIGNAL WATCH'],sha256_by_slot:hashes,
 };
 const wrong={...roster,sha256_by_slot:{...hashes,SE:'0'.repeat(64)}};
 let allow=false;
 browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
 });
 page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/omega-canonical-art-review/roster.json',async route=>
  route.fulfill({status:200,contentType:'application/json',
   body:JSON.stringify(allow?roster:wrong)}));
 await page.goto(base+'/omega-canonical-art-review/index.html',{waitUntil:'domcontentloaded'});
 await page.locator('#folder').setInputFiles(folder);
 const apply=page.locator('#applyPreview');
 if(await apply.isDisabled())throw Error('Complete 8-view art folder not recognized');
 await apply.click();
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('안전 차단'),
  {timeout:15000});
 const rejected=await page.locator('#status').textContent();
 if(!rejected?.includes('SE'))throw Error('Mismatched source hash was not rejected');
 if(!page.url().includes('omega-canonical-art-review'))throw Error('Hash mismatch escaped review');
 allow=true;
 // The review page intentionally caches its roster promise per page load.
 // Revisit it when switching from a poisoned fixture to the clean fixture.
 await page.reload({waitUntil:'domcontentloaded'});
 // Success path uses the actual direct ZIP UI with DEFLATE level-8 sources;
 // nobody must unzip or individually select eight files by hand.
 await page.locator('#zip').setInputFiles(zipPath);
 if(await apply.isDisabled())throw Error('Verified ZIP art pack was not selectable');
 await apply.click();
 await page.waitForURL(/omegaLab=1.*omegaSilverPreview=1/,{timeout:20000});
 await page.locator('[data-omega-silver-preview="ready"]').waitFor({timeout:18000});
 const artReady=await page.locator('.omega-protocol-lab')
  .getAttribute('data-omega-aira-v2-ready');
 if(artReady!=='true')throw Error('Eight real source image instances not ready in Watch Canvas');
 await page.screenshot({path:join(out,'silver-preview-SYNTHETIC-QA-ONLY-844x390.png')});
 // The same approved-shape local files must preview on the actual
 // two-game main screen without changing its Guard/Watch launch buttons.
 await page.goto(base+'/?omegaSilverPreview=1',{waitUntil:'domcontentloaded'});
 await page.locator('.rg-home[data-omega-silver-preview="ready"]').waitFor({timeout:17000});
 const hero=await page.locator('.rg-aira-v2').getAttribute('src');
 if(!hero?.startsWith('blob:'))throw Error('Main screen did not use local silver AIRA');
 const home=await page.locator('body').innerText();
 if(!home.includes('시그널 가드')||!home.includes('시그널 워치'))
  throw Error('Main screen lost either of the two original games');
 await page.screenshot({path:join(out,'silver-home-SYNTHETIC-QA-ONLY-844x390.png')});
 await page.goto(base+'/omega-canonical-art-review/index.html',{waitUntil:'domcontentloaded'});
 await page.locator('#clearPreview').click();
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('삭제했습니다'),
  {timeout:12000});
 await page.goto(base+'/?omegaLab=1&omegaSilverPreview=1',{waitUntil:'domcontentloaded'});
 await page.locator('[data-omega-silver-preview="failed"]').waitFor({timeout:16000});
 report={
  pass:errors.length===0,filesSimulated:8,hashMismatchDenied:true,
  realWatchNativeGamePreview:true,twoGameHomePreview:true,
  clearingLocalFilesDeniedPreview:true,
  originalUserArtworkTested:false,
  originalEightAngleArtApproved:false,
  screenshotsAreSynthetic:true,
  noProductionGameModified:true,errors,
 };
 if(errors.length)process.exitCode=1;
 console.log(report.pass?'QA_PASS':'QA_FAIL','OMEGA canonical original art local preview',
  JSON.stringify(report));
}catch(err){
 report={pass:false,error:String(err),errors};
 process.exitCode=1;
 console.error('QA_EXCEPTION','OMEGA canonical local sprite import',String(err));
}finally{
 await writeFile(join(out,'silver-preview-SYNTHETIC-QA-ONLY-report.json'),
  JSON.stringify(report,null,2));
 if(page)await page.close();
 if(browser)await browser.close();
 await rm(dir,{recursive:true,force:true});
}
