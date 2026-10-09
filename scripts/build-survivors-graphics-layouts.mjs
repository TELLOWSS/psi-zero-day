import fs from 'node:fs';
const inspected=JSON.parse(fs.readFileSync('artifacts/graphics-upgrade/candidate-layouts.json','utf8'));
const names=['east-v1','southeast-v1','south-v2','southwest-v1','west-v1','northwest-v1','north-v1','northeast-v1'];
const get=file=>{const row=inspected.find(r=>r.file===file);if(!row||row.issues.length)throw Error('Unusable crop layout '+file);return row;};
const prefix='/assets/survivors/graphics-v1/actors/';
const layouts=names.map(name=>{const row=get('player-'+name+'.png');return {src:prefix+row.file,frames:row.selected.map(({x,y,width,height})=>({x,y,width,height}))};});
const front=get('player-front-turns-v1.png'),rear=get('player-rear-turns-v1.png');
// Rear sheet changed headings in some columns: select by the actual drawn view.
const turnSources=[[front,0,1,false],[front,2,3,false],[front,4,5,false],[front,6,7,false],
 [front,0,1,true],[rear,2,7,false],[rear,4,5,false],[rear,3,6,false]];
for(let direction=0;direction<8;direction++){
 const [source,left,right,mirror]=turnSources[direction];
 for(const [frame,index] of [[13,left],[14,right]]){const {x,y,width,height}=source.selected[index];layouts[direction].frames[frame]={x,y,width,height,src:prefix+source.file,referenceHeight:height,...(mirror?{mirror:true}:{})};}
}
const braces=inspected.find(r=>r.file==='player-front-braces-v1.png');
if(braces){
 const front=get('player-front-braces-v1.png'),rear=get('player-rear-braces-v1.png');
 const sources=[[front,0,false],[front,2,false],[front,4,false],[front,6,false],[front,0,true],[rear,6,false],[rear,4,false],[rear,2,false]];
 for(let direction=0;direction<8;direction++)for(let pose=0;pose<2;pose++){
  const [source,start,mirror]=sources[direction],index=start+pose,{x,y,width,height}=source.selected[index];
  layouts[direction].frames[18+pose]={x,y,width,height,src:prefix+source.file,referenceHeight:source.selected[start+1].height,...(mirror?{mirror:true}:{})};
 }
}
const commandWrists=[
 [[.82,.17],[.83,.12],[.56,.28]],[[.84,.20],[.32,.30],[.84,.24]],
 [[.86,.21],[.34,.30],[.84,.23]],[[.15,.19],[.18,.22],[.42,.30]],
 [[.16,.20],[.12,.27],[.28,.31]],[[.15,.22],[.16,.21],[.08,.10]],
 [[.14,.13],[.19,.08],[.25,.17]],[[.86,.16],[.8,.1],[.58,.35]]];
for(let direction=0;direction<8;direction++)for(let pose=0;pose<3;pose++){const [x,y]=commandWrists[direction][pose];layouts[direction].frames[15+pose].sockets={wrist:{x,y}};}
const actors={player:layouts};
const directions=['east','southeast','south','southwest','west','northwest','north','northeast'];
for(const id of ['kang_taesik','yoon_sungho','lee_jaehoon','lim_junho','safety_monitor']){
 const frames=directions.map((name,direction)=>{const source=get(id+'-'+(direction===5?'northeast':name)+'-v1.png');return {src:prefix+source.file,frames:source.selected.map(({x,y,width,height})=>({x,y,width,height,...(direction===5?{mirror:true}:{})}))};});
 for(const kind of ['turns','braces']){
  const front=get(id+'-front-'+kind+(id==='lee_jaehoon'&&kind==='turns'?'-v2.png':'-v1.png')),rear=get(id+'-rear-'+kind+'-v1.png');
  // Side/diagonal views are selected by their drawn orientation; mirrors are explicit.
  const views=[[front,0,false],[front,2,false],[front,4,false],[front,2,true],[front,0,true],[rear,2,false],[rear,4,false],[rear,6,false]];
  for(let direction=0;direction<8;direction++)for(let pose=0;pose<2;pose++){
   const [source,start,mirror]=views[direction],{x,y,width,height}=source.selected[start+pose];
   frames[direction].frames[(kind==='turns'?13:18)+pose]={x,y,width,height,src:prefix+source.file,referenceHeight:source.selected[start+1].height,...(mirror?{mirror:true}:{})};
  }
 }
 const jointData=JSON.parse(fs.readFileSync('content/art/survivors-authored-joints-v1.json','utf8')).commandWrists[id];
 for(let direction=0;direction<8;direction++)for(let pose=0;pose<3;pose++){const [x,y]=jointData[direction][pose];frames[direction].frames[15+pose].sockets={wrist:{x,y}};}
 if(id==='kang_taesik'){
  const ordinary=[[.85,.24],[.8,.29],[.7,.5],[.13,.27],[.15,.25],[.75,.5],[.7,.5],[.75,.5]];
  const pivots=[[.85,.25],[.85,.27],[.8,.3],[.85,.27],[.85,.25],[.14,.27],[.18,.3],[.85,.28]];
  for(let direction=0;direction<8;direction++)for(let frame=0;frame<20;frame++)if(frame<15||frame>17){const [x,y]=[13,14,18,19].includes(frame)?pivots[direction]:ordinary[direction];frames[direction].frames[frame].sockets={wrist:{x,y}};}
 }
 actors[id]=frames;
}
fs.writeFileSync('content/art/survivors-authored-actor-layouts-v1.json',JSON.stringify(actors,null,2)+'\n');
console.log(JSON.stringify({characters:Object.keys(actors),character:'player',directions:layouts.length,frames:layouts.reduce((n,l)=>n+l.frames.length,0),turnSources:'explicitly selected and mirrored',braceSources:braces?'dedicated':'awaiting dedicated art',visualLock:false}));
