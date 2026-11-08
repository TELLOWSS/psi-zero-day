import sharp from 'sharp';

/**
 * Artist-handoff image evidence. Detect suspicious NW-to-NE flip reuse
 * by measuring alpha silhouettes, not the declared mirrored flag.
 */
const SAMPLE_WIDTH=64;
const SAMPLE_HEIGHT=96;
const ALPHA_THRESHOLD=110;

export function omegaMirroredAlphaIoU(northWest,northEast,width,height){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||
    northWest.length!==width*height||northEast.length!==width*height)
  throw new Error('OMEGA mirror QA: invalid silhouette');
 let intersection=0,union=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const a=northWest[y*width+x]>0;
  const b=northEast[y*width+(width-1-x)]>0;
  if(a||b)union++;
  if(a&&b)intersection++;
 }
 return union>0?intersection/union:0;
}
export async function omegaReadSilhouette(file){
 const {data,info}=await sharp(file,{limitInputPixels:30_000_000}).ensureAlpha()
  .resize(SAMPLE_WIDTH,SAMPLE_HEIGHT,{fit:'fill',kernel:'nearest'})
  .raw().toBuffer({resolveWithObject:true});
 if(info.channels!==4)throw new Error('OMEGA mirror QA: expected RGBA');
 const silhouette=new Uint8Array(SAMPLE_WIDTH*SAMPLE_HEIGHT);
 for(let i=0;i<silhouette.length;i++)
  silhouette[i]=data[i*4+3]>=ALPHA_THRESHOLD?1:0;
 return silhouette;
}
export function omegaMirrorVerdict(scores){
 if(!Array.isArray(scores)||scores.length!==6||scores.some(x=>!Number.isFinite(x)||x<0||x>1))
  throw new Error('OMEGA mirror QA requires six alpha overlap scores in 0..1');
 const peak=Math.max(...scores),mean=scores.reduce((a,b)=>a+b,0)/scores.length;
 return {peak,mean,suspectedMirror:peak>=.965&&mean>=.94};
}
export async function omegaDetectNWNEBitmapMirroring(nwFiles,neFiles){
 if(nwFiles.length!==6||neFiles.length!==6)throw new Error('OMEGA mirror QA requires 6 NW + 6 NE walk keyframes');
 const scores=[];
 for(let i=0;i<6;i++){
  const [nw,ne]=await Promise.all([omegaReadSilhouette(nwFiles[i]),omegaReadSilhouette(neFiles[i])]);
  scores.push(omegaMirroredAlphaIoU(nw,ne,SAMPLE_WIDTH,SAMPLE_HEIGHT));
 }
 const verdict=omegaMirrorVerdict(scores);
 return {
  scores,...verdict,
  // Calibrated against the actual known-mirrored 48-frame study at 64x96.
  // Its max ~0.968 and six-frame mean ~0.948; 0.99 would miss that real defect.
  method:'FLIPPED_ALPHA_64x96',
 };
}
