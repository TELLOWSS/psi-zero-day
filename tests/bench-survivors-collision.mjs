// Run: node --experimental-transform-types tests/bench-survivors-collision.mjs
// Deterministic collision-only stress fixture; timings are not device FPS.
import {SurvivorsCollisionGrid} from '../src/engine/survivors-collision-grid.ts';
import {sweptCircle} from '../src/engine/survivors-simulation.ts';
for(const [count,shots] of [[48,8],[128,32],[400,120]]) {
  const hazards=Array.from({length:count},(_,i)=>({id:String(i),x:(i%20)*70,y:Math.floor(i/20)*45,radius:12,hp:100}));
  const paths=Array.from({length:shots},(_,i)=>({x:(i%20)*70,y:Math.floor(i/20)*45,radius:12}));
  const run=indexed=>{
    let hits=0,candidates=0;const start=performance.now();
    for(let step=0;step<1000;step++) {
      const grid=indexed?new SurvivorsCollisionGrid(hazards):null;
      for(const p of paths) for(const h of grid?.candidates(p.x,p.y,p.x+20,p.y+10,p.radius)??hazards) {
        candidates++;if(sweptCircle(p.x,p.y,p.x+20,p.y+10,h.x,h.y,p.radius+h.radius)) hits++;
      }
    }
    return {ms:Math.round((performance.now()-start)*10)/10,hits,candidates};
  };
  run(false);run(true);
  const naive=run(false),grid=run(true);
  if(naive.hits!==grid.hits) throw new Error('Collision outcome mismatch');
  console.log(JSON.stringify({count,shots,naive,grid}));
}
