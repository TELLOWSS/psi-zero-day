import {useLayoutEffect,useRef,useState} from 'react';

/** Fit the complete map to the field, independently of the selection drawer. */
export function guardBoardShouldRotate(width:number,height:number,mapWidth=1000,mapHeight=600){
 return Math.min(width/mapHeight,height/mapWidth)>Math.min(width/mapWidth,height/mapHeight);
}

export function useGuardBoardFit(enabled:boolean,portrait:boolean){
 const ref=useRef<HTMLElement>(null);
 const [rotate,setRotate]=useState<boolean|null>(null);
 useLayoutEffect(()=>{
  const field=ref.current;
  if(!enabled||!field){setRotate(null);return;}
  const update=(width:number,height:number)=>{if(width>0&&height>0)setRotate(guardBoardShouldRotate(width,height));};
  const initial=field.getBoundingClientRect();update(initial.width,initial.height);
  if(typeof ResizeObserver==='undefined')return;
  const observer=new ResizeObserver(entries=>{const box=entries[0]?.contentRect;if(box)update(box.width,box.height);});
  observer.observe(field);
  return ()=>observer.disconnect();
 },[enabled]);
 return {ref,rotate:enabled?(rotate??portrait):portrait};
}
