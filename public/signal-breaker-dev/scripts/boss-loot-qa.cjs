/* Follow the real reward acknowledgement before testing result-screen controls.
 * Never closes dialogs through evaluate(), changes rewards, or advances stages.
 */
const acknowledged=new WeakMap();
async function acknowledgeBossLoot(page,{clock=false}={}){
 const state=await page.evaluate(()=>{const g=window.SignalBreakerQA?.engine();return g?{reward:!!g.lastBossReward,key:g.config.id+':'+g.seed}:null;});
 if(!state?.reward)return;
 let seen=acknowledged.get(page);if(!seen){seen=new Set();acknowledged.set(page,seen);}
 if(seen.has(state.key))return;
 if(clock)await page.clock.runFor(100);
 await page.locator('#bossLootDialog').waitFor({state:'visible',timeout:5000});
 await page.locator('#lootContinueBtn').click();
 await page.locator('#bossLootDialog').waitFor({state:'hidden'});
 seen.add(state.key);
}
module.exports={acknowledgeBossLoot};
