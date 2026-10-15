import fs from 'node:fs/promises';
const base=JSON.parse(await fs.readFile('content/defense/zero-breach-v1.json','utf8'));
const layouts=[
 {path:[[0,300],[220,300],[220,140],[520,140],[520,440],[800,440],[800,280],[1000,280]],pads:[[120,220],[340,230],[400,80],[410,350],[650,230],[650,530],[850,120],[900,420]]},
 {path:[[0,180],[300,180],[300,430],[600,430],[600,180],[820,180],[820,370],[1000,370]],pads:[[160,80],[160,300],[400,300],[460,520],[690,300],[700,80],[920,240],[920,500]]},
 {path:[[0,360],[200,360],[200,160],[450,160],[450,420],[700,420],[700,200],[1000,200]],pads:[[100,240],[310,260],[360,80],[360,500],[560,280],[610,520],[820,320],[860,100]]},
];
const g=(enemy,count,startTick=0,intervalTicks=12)=>({enemy,count,startTick,intervalTicks});
const waves=[
 [[g('NORMAL',16,0,18)],[g('NORMAL',22,0,14)],[g('SWIFT',20,0,16)],[g('SWARM',32,0,8)],[g('NORMAL',16),g('SWIFT',16,70,12)],[g('SWARM',40,0,7),g('NORMAL',14,110,12)]],
 [[g('NORMAL',18,0,18)],[g('SWARM',36,0,8)],[g('ARMORED',4,0,35),g('NORMAL',18,30)],[g('SWARM',44,0,7)],[g('SWIFT',32,0,12)],[g('VEILED',8,90,24),g('NORMAL',20)],[g('SWARM',44,0,7),g('ARMORED',6,100,30)]],
 [[g('NORMAL',14,0,18),g('SWIFT',6,120,24)],[g('SWARM',40,0,7)],[g('ARMORED',4,0,30),g('NORMAL',20)],[g('SWARM',48,0,7),g('SWIFT',12,160,12)],[g('VEILED',12,40,20),g('NORMAL',22)],[g('SWARM',48,0,7),g('ARMORED',8,160,28)],[g('SWIFT',30),g('VEILED',12,80,20)],[g('BOSS',1,160,1),g('SWARM',42,0,7),g('NORMAL',20,150,12)]],
];
const contents=layouts.map((layout,i)=>{
 const c=structuredClone(base);c.contentVersion='guard-foundation-1.0.0';c.balanceStatus='GUARD_FOUNDATION_CANDIDATE';c.initialResource=220;c.intermissionTicks=200;
 c.map={id:`guard-gd-0${i+1}`,nameTextId:`guard.gd0${i+1}.title`,width:1000,height:600,path:layout.path,pads:layout.pads.map(([x,y],n)=>({id:`P${n+1}`,x,y}))};
 c.waves=waves[i].map((groups,n)=>({id:n+1,groups}));
 c.supports.push({...structuredClone(c.supports[0]),id:'REBAR_LEAD',characterBinding:'yoon_sungho',skillTextId:'defense.support.REBAR_LEAD.skill',cooldownTicks:800,freezeMovementTicks:0,armorExposeTicks:80,armorExposeFraction:.35},
 {...structuredClone(c.supports[0]),id:'ENGINEER',characterBinding:'lee_jaehoon',skillTextId:'defense.support.ENGINEER.skill',cooldownTicks:600,freezeMovementTicks:0,readyOneTower:true});
 c.scenario={...c.scenario,id:`guard-gd-0${i+1}-v1`,mapId:c.map.id,availableSupports:['COORDINATOR','OBSERVER','REBAR_LEAD','ENGINEER'],firstClearCosmetic:`guard-gd-0${i+1}-first-line`,threeStarCosmetic:`guard-gd-0${i+1}-no-breach`};return c;
});
await fs.writeFile('content/defense/guard-campaign-v1.json',JSON.stringify({schemaVersion:1,contents},null,2)+'\n');
