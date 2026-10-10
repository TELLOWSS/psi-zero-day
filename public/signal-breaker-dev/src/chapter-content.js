/* Pure content: no WATCH state, browser or persistence dependency. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerChapter=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const WEAPONS=Object.freeze({
 pulse:{label:'에어 펄스',verb:'충격 · 분리',synergy:'방호판 반사 → 컨베이어 집결',limit:'큰 코어는 분리 후 회수 필요',color:'#ffe0a5',speed:770,r:8,cooldown:.29,life:1.6,cell:0},
 net:{label:'전개형 포획망',verb:'안정화 · 범위 회수',synergy:'완충·자력으로 모은 코어를 한 번에',limit:'큰 불안정 코어는 먼저 안정화',color:'#a6ffe2',speed:570,r:20,cooldown:.53,life:1.85,cell:1},
 magnet:{label:'자력 유도기',verb:'금속 궤도 굴절',synergy:'금속을 게이트 쪽으로 유도',limit:'금속 전용 · 재발사로 극성 전환',color:'#73e5ff',speed:650,r:10,cooldown:.65,life:1.7,cell:2},
 mist:{label:'안정화 미스트',verb:'분진·전력 안정화',synergy:'영역에 머무르게 한 후 집진·포획',limit:'0.75초 체류 필요 · 직접 회수 불가',color:'#ffd18d',speed:540,r:13,cooldown:.8,life:1.8,cell:3},
 anchor:{label:'장력 앵커',verb:'이동 고정 · 해제',synergy:'장력선을 멈춰 반사 타이밍 확보',limit:'1개 · 연결 240px · 같은 대상 재발사로 해제',color:'#ffae72',speed:720,r:9,cooldown:.55,life:1.7,cell:4},
 scan:{label:'회로 스캐너',verb:'약점·회로 순서 읽기',synergy:'다음 릴레이와 보스 노출 시간 확인',limit:'공격·자동 조준·회수 없음',color:'#c5abff',speed:800,r:12,cooldown:.65,life:1.65,cell:5}
});
const common={area:'CHAPTER 01 · 반입',types:['metal','dust'],magnet:{x:870,y:400},gate:{x:1019,y:461},bumper:[{x:729,y:286,r:44}],rail:[{x:515,y:323,length:168,angle:-.58}],boss:false};
const CHAPTER=[
 {...common,id:'CH-01',name:'첫 반사',summary:'방호판으로 펄스를 반사하고, 분리된 신호를 포획망으로 회수하세요.',cores:[{x:410,y:175,vx:122,vy:32,tier:2,kind:'metal'},{x:800,y:228,vx:-96,vy:-30,tier:1,kind:'metal'}],conveyor:false,loadout:['pulse','net'],unlock:['pulse','net'],artCell:-1},
 {...common,id:'CH-02',name:'이동 반입',summary:'이동하는 완충 장치의 궤도를 읽고, 벨트 방향을 바꿔 금속 회수 동선을 설계하세요.',cores:[{x:410,y:330,vx:80,vy:0,tier:2,kind:'metal'},{x:790,y:380,vx:-60,vy:15,tier:1,kind:'metal'}],conveyor:true,shuttle:{amplitude:65,period:7},loadout:['pulse','net'],unlock:['magnet'],artCell:0},
 {...common,id:'CH-03',name:'집진 통로',summary:'미스트로 분진을 안정화하고, 5초 개방·3초 대기하는 집진 게이트에 회수하세요.',cores:[{x:450,y:260,vx:45,vy:0,tier:2,kind:'dust'},{x:760,y:300,vx:-35,vy:0,tier:1,kind:'dust'}],conveyor:true,gateCycle:{period:8,open:5},gateStable:true,gateKinds:['dust','power'],loadout:['mist','net'],unlock:['mist'],artCell:1,bumper:[{x:660,y:285,r:42}],rail:[{x:530,y:350,length:170,angle:.4}]},
 {...common,id:'CH-04',name:'장력 릴레이',summary:'앵커로 장력선을 잠시 고정하고, 번호 순서대로 릴레이를 타격하세요.',cores:[{x:430,y:260,vx:70,vy:10,tier:1,kind:'load'},{x:830,y:340,vx:-65,vy:0,tier:1,kind:'metal'}],conveyor:true,tension:true,relays:true,loadout:['anchor','pulse'],unlock:['anchor','scan'],artCell:2,rail:[{x:550,y:300,length:220,angle:-.25}],bumper:[{x:750,y:365,r:35}]},
 {...common,id:'CH-05',name:'보스 · 반입동선 혼선',summary:'스캔으로 회로를 읽고 릴레이를 순서대로 타격하세요. 8초 노출 창에 보스 코어를 해소하세요.',cores:[{x:345,y:235,vx:95,vy:15,tier:1,kind:'load'},{x:620,y:340,vx:-65,vy:0,tier:1,kind:'metal'}],conveyor:true,tension:true,boss:true,orderedBoss:true,loadout:['pulse','scan'],unlock:[],artCell:3,rail:[{x:495,y:338,length:195,angle:-.48}],bumper:[{x:530,y:410,r:40}]}
];
function availableWeapons(index,lab=false){return lab?Object.keys(WEAPONS):index<0?['pulse','net']:[...new Set(CHAPTER.slice(0,index+1).flatMap(c=>c.unlock))];}
function chapterRewardDetails(id,alreadyWon,chain,lab=false){const index=CHAPTER.findIndex(c=>c.id===id),valid=index>=0&&!alreadyWon&&!lab,base=valid?80+index*20:0,bonus=valid?Math.min(100,Math.max(0,chain)*5):0;return {base,bonus,total:base+bonus};}
function chapterReward(id,alreadyWon,chain,lab=false){return chapterRewardDetails(id,alreadyWon,chain,lab).total;}
return {WEAPONS,CHAPTER,availableWeapons,chapterReward,chapterRewardDetails};
});
