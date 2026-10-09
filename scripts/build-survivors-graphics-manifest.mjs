import fs from 'node:fs';
const folder='content/art/graphics-sources';
const sources=fs.readdirSync(folder).filter(f=>f.endsWith('.json')).flatMap(file=>{const data=JSON.parse(fs.readFileSync(folder+'/'+file,'utf8'));return Array.isArray(data)?data:[data];});
const byFile=new Map(sources.map(row=>[row.file,row]));
const layouts=JSON.parse(fs.readFileSync('content/art/survivors-authored-actor-layouts-v1.json','utf8'));
const accepted=new Set(),actors=[];
for(const [id,directions] of Object.entries(layouts)){
 const crops=new Set(),mirrored=new Set();let slots=0;
 for(const layout of directions)for(const frame of layout.frames){const src=frame.src??layout.src,key=[src,frame.x,frame.y,frame.width,frame.height].join(':');accepted.add(src.split('/').pop());crops.add(key);if(frame.mirror)mirrored.add(key);slots++;}
 actors.push({id,directions:directions.length,logicalSlots:slots,uniqueSourceCrops:crops.size,mirroredSourceCrops:mirrored.size});
}
const rows=[...byFile.values()].map(row=>({...row,status:accepted.has(row.file)?'connected-candidate':row.file==='player-south-v1.png'?'rejected-merged-frames':row.file==='lee_jaehoon-front-turns-v1.png'?'rejected-face-identity':row.id?'retained-unselected-source':'connected-candidate'}));
const manifest={version:1,status:'implemented-candidates-director-visual-lock-pending',contract:{directions:8,framesPerDirection:20,characters:6,logicalSlots:960,uniqueSourceCrops:actors.reduce((n,a)=>n+a.uniqueSourceCrops,0)},actors,sourceRecords:rows,layoutFile:'content/art/survivors-authored-actor-layouts-v1.json',jointFile:'content/art/survivors-authored-joints-v1.json',reuse:{northwest:'For five supporting characters, an explicitly mirrored northeast source replaces a wrong-heading northwest candidate.',inspection:'Existing tool/command poses are shared for equipment inspection; no dedicated inspection animation is claimed.',pivot:'Reviewed front/rear pairs and explicit mirrors replace unsuitable generated pivots.',sourcePreservation:'All original generated sources and rejected project versions are retained.'},visualApproval:false};
fs.writeFileSync('content/design/survivors-graphics-animation-v1.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({actors,sourceRecords:rows.length,uniqueSourceCrops:manifest.contract.uniqueSourceCrops}));
