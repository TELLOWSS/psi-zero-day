import type {ApprovedForegroundMatte} from './survivors-stage-mattes';

/** A coverage image supplies alpha only; the authored floor supplies every color.
 * Runs once at image load. No pixel reads or offscreen construction in the draw loop.
 */
export function prepareForegroundMatte(
  coverage:HTMLImageElement,
  source:HTMLImageElement,
  matte:ApprovedForegroundMatte,
):HTMLCanvasElement|HTMLImageElement|undefined {
  if(!matte.sourceCoverage)return coverage;
  if(!coverage.naturalWidth || coverage.naturalWidth!==source.naturalWidth || coverage.naturalHeight!==source.naturalHeight)return;
  const crop=matte.sourceCrop??{x:0,y:0,width:coverage.naturalWidth,height:coverage.naturalHeight};
  if(![crop.x,crop.y,crop.width,crop.height].every(Number.isInteger) || crop.x<0 || crop.y<0 || crop.width<=0 || crop.height<=0 ||
    crop.x+crop.width>coverage.naturalWidth || crop.y+crop.height>coverage.naturalHeight)return;
  const canvas=document.createElement('canvas');canvas.width=crop.width;canvas.height=crop.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return;
  ctx.drawImage(coverage,crop.x,crop.y,crop.width,crop.height,0,0,crop.width,crop.height);
  const pixels=ctx.getImageData(0,0,crop.width,crop.height);
  // Discard generation noise below 3.2% alpha, including remote floor speckles.
  let visible=0;
  for(let i=3;i<pixels.data.length;i+=4){if(pixels.data[i]!<=8)pixels.data[i]=0;else visible++;}
  if(!visible)return;
  ctx.putImageData(pixels,0,0);
  ctx.globalCompositeOperation='source-in';
  ctx.drawImage(source,crop.x,crop.y,crop.width,crop.height,0,0,crop.width,crop.height);
  ctx.globalCompositeOperation='source-over';
  return canvas;
}
