// Strict current-home runtime delivery verification; not brand approval.
// Historical B2 approval file and its audit remain untouched.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const base=process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4173';
const out='artifacts/brand-v7-delivery';
fs.mkdirSync(out,{recursive:true});
const manifest=JSON.parse(fs.readFileSync('content/episode01/home-new-psi-art-v7.json','utf8'));
const replacement=JSON.parse(fs.readFileSync('docs/branding/NEW-PSI-HELMET-PERSPECTIVE-20261017.json','utf8'));
const approval=JSON.parse(fs.readFileSync('docs/branding/candidates/BR-LOGO-02-APPROVAL.json','utf8'));
if(replacement.authority!=='USER_REQUEST_NEW_PSI_MAIN_AND_HELMET_BRANDING_20261017'||replacement.runtimeMark!==manifest.mark.uri)throw Error('Unrecognized replacement authority or runtime mark');
if(approval.otherArtApproval!==false||approval.trademarkClearance!=='NOT_CONFIRMED')throw Error('Brand approval boundary was silently changed');
const digest=x=>createHash('sha256').update(x).digest('hex');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const rows=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.goto(base,{waitUntil:'domcontentloaded'});
   const home=page.locator('.commercial-title-home');await home.waitFor();
   if(await home.getAttribute('data-title-layout')!=='MODE_SELECT_V11')throw Error('Unexpected game home layout');
   const expected=width<height&&width<=1050?manifest.assets.portrait:manifest.assets.wide;
   const backdrop=await page.locator('.commercial-title-backdrop').evaluate(async img=>{
     await img.decode();return {uri:new URL(img.currentSrc).pathname,width:img.naturalWidth,
       height:img.naturalHeight,opacity:Number(getComputedStyle(img).opacity)};
   });
   const response=await page.request.get(new URL(expected.uri,base).href);
   const serverBytes=await response.body();
   const localBytes=fs.readFileSync(path.join('public',expected.uri.slice(1)));
   if(!response.ok()||digest(serverBytes)!==expected.sha256||digest(localBytes)!==expected.sha256
      ||backdrop.uri!==expected.uri||backdrop.width!==expected.width||backdrop.height!==expected.height
      ||backdrop.opacity<.98)throw Error('Current artwork binary/layout mismatch '+JSON.stringify(backdrop));
   const mark=await page.locator('.commercial-title-wordmark img').evaluate(async img=>{
     await img.decode();return {uri:new URL(img.currentSrc).pathname,
      width:img.naturalWidth,height:img.naturalHeight};
   });
   if(mark.uri!==replacement.runtimeMark||mark.width!==180||mark.height!==210)throw Error('User-requested shield not displayed '+JSON.stringify(mark));
   const shieldResponse=await page.request.get(new URL(mark.uri,base).href);
   const shieldLocal=fs.readFileSync(path.join('public',mark.uri.slice(1)));
   if(!shieldResponse.ok()||digest(await shieldResponse.body())!==digest(shieldLocal))throw Error('Original shield delivery differs from source');
   const favicons=await page.locator('link[rel="icon"]').evaluateAll(nodes=>nodes.map(el=>new URL(el.href).pathname));
   if(favicons.length!==2)throw Error('Expected both approved favicon variants');
   for(const uri of favicons){
     const approved=approval.approvedRuntimeFiles.find(x=>x.uri===uri);
     if(!approved)throw Error('Unknown favicon delivery: '+uri);
     const icon=await page.request.get(new URL(uri,base).href);
     if(!icon.ok()||digest(await icon.body())!==approved.sha256)throw Error('Previously approved favicon altered: '+uri);
   }
   const cards=await page.locator('.commercial-title-actions .commercial-title-action').count();
   if(cards<3||await page.locator('.is-story-entry').count()!==1
      ||await page.locator('.is-episode02-entry').count())throw Error('Story campaign or game navigation drift');
   const first=await page.locator('.hub-cinematic-intro').boundingBox();
   const jump=page.locator('.hub-reveal-modes');
   const cta=await jump.boundingBox();
   if(width===390&&(!first||first.height<height*.72||!cta||cta.height<44
       ||cta.y+cta.height>height+2))throw Error('Mobile home original artwork obstructed');
   await page.screenshot({path:path.join(out,String(width)+'x'+height+'-art.png')});
   if(width===390){await jump.click();await page.locator('.is-story-entry').scrollIntoViewIfNeeded();}
   const media=await page.locator('.commercial-title-actions img.commercial-title-action-art').evaluateAll(async images=>Promise.all(images.map(async img=>{
     await img.decode();return {uri:new URL(img.currentSrc).pathname,width:img.naturalWidth,height:img.naturalHeight};
   })));
   if(media.length<3||media.some(x=>x.width<700||x.height<400))throw Error('Unreadable mode artwork '+JSON.stringify(media));
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
   if(overflow||errors.length)throw Error('Horizontal overflow or JS exception '+JSON.stringify({overflow,errors}));
   rows.push({width,height,art:backdrop,shield:mark,modeArt:media,pass:true});
   console.log('PASS current v7 title delivery',width,height);
  }finally{await page.close()}
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({
   scope:'CURRENT_HOME_BINARY_AND_LAYOUT_ONLY_NOT_BRANDING_OR_TRADEMARK_APPROVAL',
   historicalB2Audit:'unchanged',otherArtApproved:false,rows},null,2)+'\n');
}finally{await browser.close()}
