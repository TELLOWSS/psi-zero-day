const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE||'playwright');const a=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.PSI_QA_BASE_URL||'http://127.0.0.1:4174';
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),rows=[];try{
 for(const [width,height] of [[390,844],[844,390],[1440,900]]){
  const c=await b.newContext({viewport:{width,height},serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{const paint=CanvasRenderingContext2D.prototype.fillText;window.workerExitSigns=new Map();CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...rest){if(typeof text==='string'&&text.includes('안전통로 출구'))window.workerExitSigns.set(text,{text,x,y});return paint.call(this,text,x,y,...rest);};});
  await p.goto(base+'/');await p.locator('.is-survivors-entry').click();await p.getByRole('button',{name:'시그널 워치 시작',exact:true}).click({timeout:45000});await p.waitForFunction(()=>window.workerExitSigns.size===2);const signs=await p.evaluate(()=>[...window.workerExitSigns.values()]);a.ok(signs.some(s=>s.text.startsWith('↑')));a.ok(signs.some(s=>s.text.startsWith('↓')));a.ok(signs.every(s=>s.x===700));a.deepEqual(errors,[]);rows.push({width,height,signs,checks:['normal WATCH launch','shared corridor exit signs in live renderer','both exit directions','no injected workers or altered game state'],errors});await c.close();console.log('PASS deployed exits '+width+'x'+height);
 }
 fs.writeFileSync('artifacts/worker-egress-production.json',JSON.stringify({base,rows},null,2));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
