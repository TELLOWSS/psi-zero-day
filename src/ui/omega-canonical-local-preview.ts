import type {OmegaHeading} from './omega-protocol-actor-render';

export const OMEGA_SILVER_REVIEW_DB='psi-omega-canonical-review-v1';
export const OMEGA_SILVER_REVIEW_STORE='sprites';
export const OMEGA_SILVER_REVIEW_MODE='omegaSilverPreview';
export const OMEGA_SILVER_HEADINGS=['E','SE','S','SW','W','NW','N','NE'] as const;

export interface OmegaSilverPreviewRecord{
 readonly slot:OmegaHeading|'M01';
 readonly sha256:string;
 readonly bytes:ArrayBuffer;
 readonly mime:'image/webp';
 readonly width:384;
 readonly height:512;
 readonly mode:'REVIEW_ONLY';
}
export interface OmegaSilverPreviewSession{
 readonly loaded:readonly OmegaHeading[];
 readonly urls:ReadonlyMap<OmegaHeading,string>;
 revoke():void;
}
/** repo mode is usable only in the development OMEGA lab, never production. */
export function omegaSilverRepoPreviewEnabled(search:string):boolean {
 return new URLSearchParams(search).get(OMEGA_SILVER_REVIEW_MODE)==='repo'&&
  (import.meta.env.DEV||import.meta.env.VITE_OMEGA_PROTOCOL_LAB==='1');
}
export function omegaSilverPreviewEnabled(search:string):boolean {
 return new URLSearchParams(search).get(OMEGA_SILVER_REVIEW_MODE)==='1'||
  omegaSilverRepoPreviewEnabled(search);
}
export function omegaSilverReviewUrl():string{
 return '/?omegaLab=1&omegaSilverPreview=1';
}
export function omegaSilverPreviewAcceptableRoster(roster:unknown):roster is {
 stage:'review_only';production_approved:false;main_games:['SIGNAL GUARD','SIGNAL WATCH'];
 sha256_by_slot:Record<OmegaHeading|'M01',string>;
}{
 if(!roster||typeof roster!=='object')return false;
 const v=roster as Record<string,unknown>;
 const games=v.main_games;
 const hashes=v.sha256_by_slot;
 return v.stage==='review_only'&&v.production_approved===false&&
  Array.isArray(games)&&games.length===2&&
  games[0]==='SIGNAL GUARD'&&games[1]==='SIGNAL WATCH'&&
  hashes!==null&&typeof hashes==='object'&&
  [...OMEGA_SILVER_HEADINGS,'M01'].every(h=>{
   const hash=(hashes as Record<string,unknown>)[h];
   return typeof hash==='string'&&/^[a-f0-9]{64}$/.test(hash);
  });
}
export async function omegaSilverHash(bytes:ArrayBuffer):Promise<string>{
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function openDb():Promise<IDBDatabase>{
 if(typeof indexedDB==='undefined')return Promise.reject(Error('IndexedDB unavailable'));
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(OMEGA_SILVER_REVIEW_DB,1);
  req.onupgradeneeded=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains(OMEGA_SILVER_REVIEW_STORE))
    db.createObjectStore(OMEGA_SILVER_REVIEW_STORE,{keyPath:'slot'});
  };
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||Error('Browser review storage unavailable'));
 });
}
function readRecord(db:IDBDatabase,slot:OmegaHeading):Promise<OmegaSilverPreviewRecord|null>{
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(OMEGA_SILVER_REVIEW_STORE,'readonly');
  const request=tx.objectStore(OMEGA_SILVER_REVIEW_STORE).get(slot);
  request.onsuccess=()=>resolve(request.result??null);
  request.onerror=()=>reject(request.error||Error('Review record inaccessible'));
 });
}
async function rosterHashes():Promise<Record<OmegaHeading|'M01',string>>{
 const resp=await fetch('/omega-canonical-art-review/roster.json',{cache:'no-store'});
 if(!resp.ok)throw Error('Canonical silver AIRA roster missing');
 const json:unknown=await resp.json();
 if(!omegaSilverPreviewAcceptableRoster(json))
  throw Error('Canonical roster unsafe: live approval or incorrect game labels');
 return json.sha256_by_slot;
}
/** The canonical nine source WebP images are now real GitHub binary blobs.
 * Direct DEV-only source mode: avoid asking the user to re-upload art already
 * pinned by SHA-256 in the repo. This is not a production-game asset toggle.
 */
export async function omegaLoadSilverRepoReview():Promise<OmegaSilverPreviewSession>{
 if(!import.meta.env.DEV&&import.meta.env.VITE_OMEGA_PROTOCOL_LAB!=='1')
  throw Error('Repository silver art review requires the development OMEGA lab');
 const hashes=await rosterHashes();
 const urls=new Map<OmegaHeading,string>();
 try{
  for(const heading of OMEGA_SILVER_HEADINGS){
   const asset='/assets/omega/canonical-review/aira-v2/'+heading.toLowerCase()+'.webp';
   const resp=await fetch(asset,{cache:'no-store'});
   if(!resp.ok)throw Error('GitHub silver review asset missing: '+heading);
   const bytes=await resp.arrayBuffer();
   if(await omegaSilverHash(bytes)!==hashes[heading])
    throw Error('GitHub silver source hash mismatch: '+heading);
   const url=URL.createObjectURL(new Blob([bytes],{type:'image/webp'}));
   urls.set(heading,url);
   // SHA-256 validation alone is insufficient; verify the real browser
   // decoder and the source image's authoring canvas dimensions.
   const image=new Image();
   image.src=url;
   await image.decode();
   if(image.naturalWidth!==384||image.naturalHeight!==512)
    throw Error('GitHub silver image dimension mismatch: '+heading);
  }
  return {loaded:[...OMEGA_SILVER_HEADINGS],urls,
   revoke(){for(const url of urls.values())URL.revokeObjectURL(url);}};
 }catch(error){
  for(const url of urls.values())URL.revokeObjectURL(url);
  throw error;
 }
}

/** Read review-only WebPs uploaded via the local art review page or, in the
 * development lab only, the exact nine GitHub-pinned source binaries.
 * Re-check SHA-256 before creating any object URL. No user file uploads.
 */
export async function omegaLoadSilverPreview():Promise<OmegaSilverPreviewSession>{
 if(typeof window!=='undefined'&&
    omegaSilverRepoPreviewEnabled(window.location.search))
  return omegaLoadSilverRepoReview();
 const hashes=await rosterHashes();
 const db=await openDb();
 const urls=new Map<OmegaHeading,string>();
 try{
  for(const heading of OMEGA_SILVER_HEADINGS){
   const record=await readRecord(db,heading);
   if(!record||record.mode!=='REVIEW_ONLY'||
    record.mime!=='image/webp'||record.width!==384||record.height!==512||
    record.sha256!==hashes[heading]||
    !(record.bytes instanceof ArrayBuffer)||
    await omegaSilverHash(record.bytes)!==hashes[heading]){
    throw Error('Silver AIRA review art missing/changed: '+heading);
   }
   urls.set(heading,URL.createObjectURL(new Blob([record.bytes],{type:'image/webp'})));
  }
  return {loaded:[...OMEGA_SILVER_HEADINGS],urls,
   revoke(){for(const url of urls.values())URL.revokeObjectURL(url);}};
 }catch(error){
  for(const url of urls.values())URL.revokeObjectURL(url);
  throw error;
 }finally{db.close();}
}
