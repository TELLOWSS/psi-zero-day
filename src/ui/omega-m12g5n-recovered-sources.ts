import {OMEGA_G5I_FILE_NAMES} from './omega-protocol-m12g5i-action-art';
import {OMEGA_INFECTED_FILES} from './omega-infected-candidate-review';

/**
 * M12-G5n recovered original WebPs from user's Google Drive into this QA branch.
 * Bundles are source material for human inspection, NOT approved art.
 *
 * Intentionally located under /qa-art (not /public/assets): Vite DEV can
 * serve them but Vite production does not copy the source to dist.
 * Only an explicit DEV action fetches/loads the binaries.
 */
export const OMEGA_G5N_RECOVERED_ART={
 aira:{dir:'/qa-art/m12g5n/aira',anchor:'g5j-anchors.json',
  names:OMEGA_G5I_FILE_NAMES},
 infected:{dir:'/qa-art/m12g5n/infected',anchor:'infected-anchors.json',
  names:OMEGA_INFECTED_FILES},
} as const;
export type OmegaG5nKind=keyof typeof OMEGA_G5N_RECOVERED_ART;
export const OMEGA_G5N_RECOVERY_GATE={
 sourcesRestoredToQaBranch:28,
 defaultGameArtReplaced:false,
 independentlyPaintedArtProven:false,
 artDirectorApproved:false,
 mainMerged:false,
 productionAllowed:false,
} as const;

export async function omegaG5nFetchQaSources(
 kind:OmegaG5nKind,fetcher:typeof fetch=fetch,
):Promise<readonly File[]>{
 if(!import.meta.env.DEV)throw Error('Recovered art is only for Vite DEV review');
 const spec=OMEGA_G5N_RECOVERED_ART[kind];
 const files:File[]=[];
 const required=[...spec.names,spec.anchor];
 for(const name of required){
  const url=spec.dir+'/'+name;
  const res=await fetcher(url,{cache:'no-store'});
  if(!res.ok)throw Error('Missing genuine recovered QA source: '+name);
  const bytes=await res.arrayBuffer();
  const isJson=name===spec.anchor;
  if(bytes.byteLength<=0||bytes.byteLength>(isJson?100_000:8_000_000))
   throw Error('Recovered file length out of bounds: '+name);
  if(!isJson){
   const u8=new Uint8Array(bytes);
   if(u8.length<16||
    String.fromCharCode(...u8.subarray(0,4))!=='RIFF'||
    String.fromCharCode(...u8.subarray(8,12))!=='WEBP')
     throw Error('Recovered source is not a WebP: '+name);
  }
  files.push(new File([bytes],name,{type:isJson?'application/json':'image/webp'}));
 }
 // These files still pass the strict existing SHA / alpha / anchor importers.
 // Merely fetching a file never toggles the current game art.
 return files;
}
