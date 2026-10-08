export type GraphicsMode='smooth'|'recommended'|'vivid';
export const GRAPHICS_KEY='psi.survivors.graphics_v1';
export const GRAPHICS_PROFILES={
 smooth:{pixelRatio:1,particles:.35},
 recommended:{pixelRatio:1.5,particles:.65},
 vivid:{pixelRatio:2,particles:1},
} as const;
export function readGraphicsMode(raw:string|null):GraphicsMode {
 return raw==='smooth'||raw==='vivid'?raw:'recommended';
}
let current:GraphicsMode|undefined;
const listeners=new Set<()=>void>();
export function getGraphicsMode():GraphicsMode {
 if(!current){try{current=readGraphicsMode(localStorage.getItem(GRAPHICS_KEY));}catch{current='recommended';}}
 return current;
}
export function setGraphicsMode(mode:GraphicsMode):void {
 current=mode;try{localStorage.setItem(GRAPHICS_KEY,mode);}catch{/* Session setting remains available. */}
 for(const listener of listeners)listener();
}
export function subscribeGraphics(listener:()=>void):()=>void {
 listeners.add(listener);return ()=>{listeners.delete(listener);};
}
