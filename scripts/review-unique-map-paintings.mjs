import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'sharp'));
const rows=JSON.parse(fs.readFileSync('content/design/survivors-unique-map-assets-v1.json','utf8')).maps;
const out=path.resolve('artifacts/unique-maps');fs.mkdirSync(out,{recursive:true});
for(let start=0;start<rows.length;start+=16){
  const composites=[];
  for(const [index,row] of rows.slice(start,start+16).entries()){
    const input=await sharp('public'+row.uri).resize(384,256,{fit:'fill'}).png().toBuffer();
    composites.push({input,left:index%4*384,top:Math.floor(index/4)*256});
  }
  await sharp({create:{width:1536,height:1024,channels:3,background:'#101010'}}).composite(composites).png().toFile(path.join(out,`review-${start/16+1}.png`));
  console.log(JSON.stringify({sheet:start/16+1,order:rows.slice(start,start+16).map(r=>r.number)}));
}
