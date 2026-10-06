import {expect,it} from 'vitest';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
it.each(['metal','debris','vapor','inspection-drone-launch','hunter-drone-launch'])('keeps six distinct transparent %s frames inside their cells',async material=>{
 const name=material.endsWith('drone-launch')?`${material}-v1`:`${material}-impact-sequence-v1`;
 const {data,info}=await sharp(`public/assets/survivors/${name}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 expect([info.width,info.height]).toEqual([1536,1024]);
 const hashes=new Set<string>(),coreEnergy:number[]=[];
 for(let cell=0;cell<6;cell++){
  const frame=Buffer.alloc(512*512*4);let count=0,core=0,left=512,right=0,top=512,bottom=0;
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){
   const offset=((Math.floor(cell/3)*512+y)*info.width+cell%3*512+x)*4,dest=(y*512+x)*4;
   data.copy(frame,dest,offset,offset+4);const alpha=data[offset+3]!;
   if(alpha>32){count++;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   if(Math.abs(x-256)<20&&Math.abs(y-256)<20)core+=(data[offset]!+data[offset+1]!+data[offset+2]!)*alpha/255;
  }
  expect(count).toBeGreaterThan(1000);expect(frame[3]).toBe(0);
  expect(Math.min(left,top)).toBeGreaterThanOrEqual(32);expect(Math.max(right,bottom)).toBeLessThan(480);
  hashes.add(createHash('sha256').update(frame).digest('hex'));coreEnergy.push(core);
 }
 expect(hashes.size).toBe(6);expect(coreEnergy[5]!).toBeLessThan(coreEnergy[1]!*.2);
});
