const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE||'playwright');
const a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const helmets=require('../content/art/character-helmets-new-psi-v1.json');const branded=uri=>helmets.items.find(x=>x.originalUri===uri)?.uri??uri;
const cast=JSON.parse(fs.readFileSync('content/episode01/character-art-production.json','utf8')).characters;
const base=process.env.PSI_QA_BASE_URL||'http://127.0.0.1:4173',out=path.resolve(process.env.PSI_QA_OUTPUT||'artifacts/character-identity');fs.mkdirSync(out,{recursive:true});
const pathname=uri=>new URL(uri,base).pathname;
const settled=page=>page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.offsetWidth&&i.offsetHeight).map(i=>i.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_BIN}),rows=[];try{
 for(const [name,width,height] of [['portrait',390,844],['landscape',844,390],['pc',1440,900]]){
  const c=await b.newContext({viewport:{width,height},serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'/');await p.locator('.commercial-title-utility').getByRole('button',{name:'동료',exact:true}).click();
  const people=await p.locator('.hub-person-grid button').evaluateAll(buttons=>buttons.map(b=>({name:b.querySelector('strong').textContent,uri:b.querySelector('img').src})));
  a.equal(people.length,8);const portraits={};
  for(const [index,person] of people.entries()){
   const id=cast[index].id,expected='/'+branded(cast[index].portrait_path);a.equal(pathname(person.uri),expected,id+' companion icon');portraits[id]=expected;
   await p.locator('.hub-person-grid button').nth(index).click();const image=p.locator('.hub-person-detail>img');a.equal(pathname(await image.getAttribute('src')),expected,id+' companion detail');await image.evaluate(i=>i.decode());
  }
  await p.locator('.hub-person-grid button').nth(1).click();await settled(p);await p.screenshot({path:path.join(out,name+'-companions.png'),animations:'disabled'});
  await p.goto(base+'/');await p.locator('.is-survivors-entry').click();await p.locator('.survivors-preflight-tabs').getByRole('button',{name:'순찰 요원',exact:true}).click({timeout:45000});
  const cards=p.locator('.survivors-char-card');a.equal(await cards.count(),6);const agents=[];
  for(let i=0;i<6;i++){
   const card=cards.nth(i),image=card.locator('.survivors-char-portrait-thumb'),uri=await image.getAttribute('src');await image.evaluate(i=>i.decode());
   const label=(await card.locator('strong').first().textContent()).trim();const person=people.find(x=>x.name===label);if(person)a.equal(pathname(uri),pathname(person.uri),label+' WATCH roster versus companions');
   await card.click();await p.locator('.survivors-preflight-tabs').getByRole('button',{name:'작전 준비',exact:true}).click();const hero=p.locator('.survivors-monarch-hero-img');await hero.evaluate(i=>i.decode());a.equal(pathname(await hero.getAttribute('src')),pathname(uri),label+' WATCH hero versus roster');a.equal(await hero.evaluate(i=>getComputedStyle(i).objectFit),'contain');
   agents.push({name:label,portrait:pathname(uri),hero:pathname(await hero.getAttribute('src'))});await p.locator('.survivors-preflight-tabs').getByRole('button',{name:'순찰 요원',exact:true}).click();
  }
  await settled(p);await p.screenshot({path:path.join(out,name+'-watch-roster.png'),animations:'disabled'});
  await p.goto(base+'/signal-breaker-dev/index.html');await p.waitForSelector('#operationLobby:not([hidden])',{timeout:45000});await p.locator('#lobbyCareers').click();
  const breaker=await p.locator('.career-card').evaluateAll(cards=>cards.map(card=>({id:card.dataset.character,name:card.querySelector('strong').textContent,uri:card.querySelector('img').src})));
  a.equal(breaker.length,6);for(const entry of breaker){const spec=cast.find(x=>x.id===entry.id);const expected=spec?'/'+branded(spec.map_path):'/assets/survivors/safety-monitor-v2.webp';a.equal(pathname(entry.uri),expected,entry.name+' breaker sprite');}
  a.deepEqual(errors,[]);rows.push({name,width,height,people,agents,breaker,checks:['8 companion icons and details','6 WATCH roster and hero identities','6 BREAKER actor bindings','images decode','hero preserves full crop','no JS errors'],errors});await c.close();console.log('PASS character identity '+name);
 }
 fs.writeFileSync(path.join(out,'character-identity.json'),JSON.stringify({base,reference:'WATCH patrol-agent roster; expression and map images also visually compared against approved cast production files',rows},null,2));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
