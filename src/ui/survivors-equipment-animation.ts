const shockOrigins = [[260,348],[256,348],[242,348],[267,278],[264,278],[236,278]] as const;
const barrierOrigins = [[263,273],[253,274],[254,275],[263,263],[245,267],[254,236]] as const;
const dispatchOrigins = [[340,283],[344,281],[348,282],[391,290],[390,290],[380,295]] as const;

/** Align authored emission cores without changing their branching/decay drawings. */
function prepareEquipmentAnimation(image:HTMLImageElement,origins:readonly (readonly [number,number])[],scale=.35):HTMLCanvasElement {
  const sheet=document.createElement('canvas');sheet.width=1536;sheet.height=256;
  const ctx=sheet.getContext('2d');
  if(!ctx)throw new Error('Equipment animation canvas unavailable');
  const sw=image.naturalWidth/3,sh=image.naturalHeight/2;
  for(let i=0;i<6;i++){
    const [ox,oy]=origins[i]!;
    ctx.save();ctx.beginPath();ctx.rect(i*256,0,256,256);ctx.clip();
    ctx.drawImage(image,(i%3)*sw,Math.floor(i/3)*sh,sw,sh,i*256+128-ox*scale,128-oy*scale,512*scale,512*scale);
    ctx.restore();
  }
  return sheet;
}

export function prepareShockAnimation(image:HTMLImageElement):HTMLCanvasElement {
  return prepareEquipmentAnimation(image,shockOrigins);
}
export function prepareBarrierAnimation(image:HTMLImageElement):HTMLCanvasElement {
  return prepareEquipmentAnimation(image,barrierOrigins);
}
export function prepareDispatchAnimation(image:HTMLImageElement):HTMLCanvasElement {
  return prepareEquipmentAnimation(image,dispatchOrigins,.25);
}

export type PremiumPresenceImages=Record<'gold'|'cyan'|'violet',HTMLCanvasElement>;
export function preparePremiumPresence(image:HTMLImageElement):PremiumPresenceImages {
  const base=prepareEquipmentAnimation(image,Array.from({length:6},()=>[256,256] as const),.4);
  const result={} as PremiumPresenceImages;
  for(const [palette,color] of Object.entries({gold:'#ffd27a',cyan:'#72e6ff',violet:'#c995ff'}) as [keyof PremiumPresenceImages,string][]){
    const canvas=document.createElement('canvas');canvas.width=base.width;canvas.height=base.height;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Premium presence canvas unavailable');
    ctx.drawImage(base,0,0);ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=.6;
    ctx.fillStyle=color;ctx.fillRect(0,0,canvas.width,canvas.height);result[palette]=canvas;
  }
  return result;
}
