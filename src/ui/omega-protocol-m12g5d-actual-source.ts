import {omegaG5cReview,type OmegaG5cReviewProof, type OmegaG5cLocalPainterlyReview} from './omega-protocol-m12g5c-local-art-review';

/**
 * M12-G5d-2: actual four ORIGINAL binary WebPs from the user-reviewed
 * 2x2 AI-created AIRA sprite sheet, NOT synthetic QA rectangles and NOT
 * four separately hand-painted production-approved animation sources.
 * These four exact hashes were checked against the prior conversation ZIP,
 * then each GitHub binary blob SHA-1 was compared after upload.
 */
export const OMEGA_G5D_ACTUAL_E_WALK=[
 {file:'aira-east-walk-0.webp',path:'/assets/omega/g5d/aira-east-walk-0.webp',
  sha256:'2dfb4825f403cbe0915764234be4b2697d445bfa3fb55bcb1955afc362fa3a04',
  bytes:67306,gitBlobSha:'07598d311349fa09d7605bc528237c49db26a29a'},
 {file:'aira-east-walk-1.webp',path:'/assets/omega/g5d/aira-east-walk-1.webp',
  sha256:'2c65fdcc5acb98f77e20d38f1945e1355c9f759463395b42e35c482426a8c13b',
  bytes:64066,gitBlobSha:'15ace6c5b586aff83aeff20a5e88c47a11557441'},
 {file:'aira-east-walk-2.webp',path:'/assets/omega/g5d/aira-east-walk-2.webp',
  sha256:'79ff9f7bf76342d298144d28f8dec5b128063206258fec8c9dc4fb23400795c4',
  bytes:67264,gitBlobSha:'4e81f98ecd3c30a5ed9d0bffa520f2436a9cd21a'},
 {file:'aira-east-walk-3.webp',path:'/assets/omega/g5d/aira-east-walk-3.webp',
  sha256:'7fe9a9b91b60f40c25abd286906db2b014c51f0de91d72fffa72af08e7eda759',
  bytes:62964,gitBlobSha:'3c478f58272c40dd31405dd2ff82e0b87ac4bf31'},
] as const;
export const OMEGA_G5D_ART_GATE={
 sourceFourOriginalBinaryWebPsCommitted:true,
 origin:'AI_SHEET_FOUR_DISTINCT_CROPS',
 usableInDevPreviewOnly:true,
 humanArtDirectionApproved:false,
 final160ApprovedFrameCount:0,final320ApprovedMaskCount:0,
 automaticLiveGameSwap:false,
 productionReleaseAllowed:false,
} as const;
export function omegaG5dLabRequested(search:string,dev:boolean):boolean{
 if(!dev)return false;
 const q=new URLSearchParams(search);
 return q.get('omegaLab')==='1'&&q.get('omegaM12G5d')==='1'&&
  !['omegaSilverPreview','omegaM12G4','omegaM12G5','omegaM12G5b',
   'omegaM12G5c','omegaG5VectorStudy'].some(key=>q.has(key));
}
async function sha256(bytes:ArrayBuffer):Promise<string>{
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function realWebPHeader(bytes:ArrayBuffer):boolean{
 const view=new Uint8Array(bytes);
 return view.length>=16&&
  String.fromCharCode(...view.subarray(0,4))==='RIFF'&&
  String.fromCharCode(...view.subarray(8,12))==='WEBP';
}
/** This same-origin fetch cannot access user accounts, paid AI APIs, or remote
 * websites. Exact SHA/bytes and decoded dimensions must pass before artist
 * can explicitly enable one session's E walk preview in the native engine.
 * User's canonical eight-direction silver AIRA art never changes by itself.
 */
export async function omegaG5dImportRepoCandidates(
 review:OmegaG5cLocalPainterlyReview=omegaG5cReview,
 fetcher:typeof fetch=fetch,
):Promise<OmegaG5cReviewProof>{
 review.dispose();
 try{
  const files:File[]=[];
  for(const original of OMEGA_G5D_ACTUAL_E_WALK){
   const res=await fetcher(original.path,{cache:'no-store'});
   if(!res.ok)throw Error('Actual 4-source GitHub candidate missing: '+original.file);
   const data=await res.arrayBuffer();
   if(data.byteLength!==original.bytes||!realWebPHeader(data))
    throw Error('Candidate actual binary length/RIFF header mismatch: '+original.file);
   const actual=await sha256(data);
   if(actual!==original.sha256)
    throw Error('Actual source SHA-256 changed unexpectedly: '+original.file);
   files.push(new File([data],original.file,{type:'image/webp'}));
  }
  const proof=await review.import(files);
  if(proof.assets.some((asset,i)=>asset.sha256!==OMEGA_G5D_ACTUAL_E_WALK[i]?.sha256)){
   review.dispose();throw Error('Proof source SHA-256 mismatch');
  }
  return proof;
 }catch(e){
  review.dispose();throw e;
 }
}
