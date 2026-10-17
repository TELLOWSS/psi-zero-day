import fs from 'node:fs/promises';
const file='content/defense/guard-campaign-v1.json',raw=JSON.parse(await fs.readFile(file,'utf8')),foundation=raw.contents.slice(0,3);
const data={
 PULSE:[{damage:28,intervalTicks:8,range:180,ultimate:'VOLLEY',damageType:'PHYSICAL'},{damage:48,intervalTicks:22,range:215,ultimate:'PIERCE',damageType:'PURE'}],
 BURST:[{damage:58,intervalTicks:48,range:180,splashRadius:145,maxTargets:12,ultimate:'WAVE',damageType:'PHYSICAL'},{damage:116,intervalTicks:48,range:200,splashRadius:65,maxTargets:4,ultimate:'DELAY',damageType:'PURE'}],
 CONTROL:[{damage:14,intervalTicks:32,range:165,splashRadius:65,maxTargets:3,slowFraction:.65,slowTicks:40,ultimate:'LOCK'},{damage:9,intervalTicks:24,range:165,splashRadius:110,maxTargets:7,slowFraction:.4,slowTicks:40,ultimate:'BOUNDARY'}],
 SENSOR:[{damage:20,intervalTicks:18,range:195,revealRadius:220,revealIntervalTicks:20,revealTicks:80,ultimate:'OBSERVATION'},{damage:35,intervalTicks:15,range:175,revealRadius:175,revealIntervalTicks:20,revealTicks:70,ultimate:'ANALYSIS'}]
};
for(const c of foundation){c.contentVersion='guard-underground-2.0.0';c.rulesVersion='guard-rules-2';c.ultimateEnabled=true;c.targetModes=['FIRST','STRONG','THREAT'];
 c.supports=c.supports.filter(s=>s.id!=='COMMANDER'&&s.id!=='SIGNALER');
 c.supports.push({...structuredClone(c.supports[0]),id:'COMMANDER',characterBinding:'player',skillTextId:'guard.support.COMMANDER',freezeMovementTicks:0,cooldownTicks:900,relocation:true},
 {...structuredClone(c.supports[0]),id:'SIGNALER',characterBinding:'choi_minseok',skillTextId:'guard.support.SIGNALER',freezeMovementTicks:0,cooldownTicks:800,directionalRange:{bonus:90,halfAngle:Math.PI/6,durationTicks:120}});
 c.scenario.availableSupports=['COORDINATOR','OBSERVER','REBAR_LEAD','ENGINEER','COMMANDER','SIGNALER'];
 for(const t of c.towers){t.levels=t.levels.filter(l=>!l.id.startsWith('L4'));for(const [i,branch] of ['A','B'].entries()){const parent=t.levels.find(l=>l.id===`L3${branch}`);t.levels.push({...structuredClone(parent),...data[t.id][i],id:`L4${branch}`,from:`L3${branch}`,cost:t.id==='CONTROL'?240:260});}}
}
const g=(enemy,count,startTick=0,intervalTicks=10,routeId)=>({enemy,count,startTick,intervalTicks,...(routeId?{routeId}:{})});
const maps=[
 {path:[[0,300],[230,300],[230,140],[500,140],[500,440],[790,440],[790,250],[1000,250]],pads:[[110,200],[340,230],[370,80],[390,390],[650,260],[650,530],[890,130],[900,400]]},
 {path:[[0,160],[260,160],[260,300],[600,300],[600,160],[800,160],[800,300],[1000,300]],routes:[{id:'upper',path:[[0,160],[260,160],[260,300],[600,300],[600,160],[800,160],[800,300],[1000,300]]},{id:'lower',path:[[0,450],[370,450],[370,300],[600,300],[600,160],[800,160],[800,300],[1000,300]]}],pads:[[140,70],[140,310],[410,180],[470,530],[710,390],[710,70],[890,420],[900,100]]},
 {path:[[0,160],[250,160],[250,430],[590,430],[590,160],[800,160],[800,300],[1000,300]],routes:[{id:'main',path:[[0,160],[250,160],[250,430],[590,430],[590,160],[800,160],[800,300],[1000,300]]}],transition:{id:'gd06-corridor-switch',beforeWave:5,routes:[{id:'main',path:[[0,450],[350,450],[350,230],[650,230],[650,430],[840,430],[840,300],[1000,300]]}]},pads:[[120,300],[120,65],[460,330],[460,90],[720,320],[700,530],[900,160],[900,520]]}
];
const waves=[
 [[g('NORMAL',24,0,16)],[g('VEILED',12,80,16),g('NORMAL',20)],[g('SWARM',48,0,6)],[g('ARMORED',6,0,28),g('NORMAL',24,30)],[g('VEILED',18,0,15),g('SWIFT',22,100,12)],[g('SWARM',56,0,5),g('ARMORED',8,90,25)],[g('BOSS',1,180),g('VEILED',16,30,16),g('SWARM',52,0,6)]],
 [[g('NORMAL',16,0,16,'upper'),g('NORMAL',16,30,16,'lower')],[g('SWARM',32,0,7,'upper'),g('SWARM',32,60,7,'lower')],[g('ARMORED',6,0,28,'lower'),g('NORMAL',26,0,12,'upper')],[g('SWIFT',28,0,12,'upper'),g('VEILED',16,70,18,'lower')],[g('SWARM',40,0,5,'upper'),g('SWARM',40,50,5,'lower')],[g('ARMORED',10,10,28,'upper'),g('VEILED',18,0,15,'lower')],[g('SWIFT',32,0,10,'lower'),g('SWARM',48,30,5,'upper')],[g('BOSS',1,180,1,'lower'),g('SWARM',48,0,5,'upper'),g('VEILED',20,70,15,'lower')]],
 [[g('NORMAL',28,0,14)],[g('SWARM',48,0,6)],[g('VEILED',14,40,17),g('SWIFT',22,0,12)],[g('ARMORED',8,0,26),g('SWARM',48,40,6)],[g('NORMAL',24,0,13),g('VEILED',16,70,17)],[g('SWARM',64,0,5),g('SWIFT',24,130,10)],[g('ARMORED',10,0,25),g('VEILED',20,30,15)],[g('SWARM',64,0,5),g('ARMORED',10,140,25)],[g('BOSS',1,160),g('SWARM',56,0,5),g('VEILED',22,80,14)]]
];
const underground=maps.map((map,i)=>{const c=structuredClone(foundation[2]),n=i+4;c.initialResource=480;c.map={...map,id:`guard-gd-0${n}`,nameTextId:`guard.gd0${n}.title`,width:1000,height:600,pads:map.pads.map(([x,y],j)=>({id:`P${j+1}`,x,y}))};if(n===6)c.sensorPressure={waves:[1,2,3],warningTicks:80,activeTicks:60};c.waves=waves[i].map((groups,j)=>({id:j+1,groups}));c.scenario={...c.scenario,id:`guard-gd-0${n}-v1`,mapId:c.map.id,firstClearCosmetic:`guard-gd-0${n}-first-line`,threeStarCosmetic:`guard-gd-0${n}-no-breach`};return c;});
await fs.writeFile(file,JSON.stringify({schemaVersion:1,contents:[...foundation,...underground]},null,2)+'\n');
console.log('Guard P2: 6 stages, 6 supports, 24 tower states');
