import {useEffect,useState} from 'react';
import {omegaLoadSilverRepoReview,omegaSilverRepoPreviewEnabled,type OmegaSilverPreviewSession} from './omega-canonical-local-preview';

/** A released build must never load cosmetic review sources, even with a query string. */
export function omegaGuardSourcePreviewAllowed(guard:boolean,search:string):boolean {
 return guard&&import.meta.env.DEV&&omegaSilverRepoPreviewEnabled(search);
}

/**
 * DEV REVIEW ONLY: SIGNAL GUARD is a tower-defense game; it has no
 * player-controlled humanoid with an 8-way movement vector.
 *
 * Place the SHA-256 verified original SOUTH-facing AIRA image on the ACTUAL
 * Guard SVG battlefield as a non-interactive command observer. This changes
 * no support selection, collision, wave timing, economy or save state.
 *
 * This is an in-world identity preview, NOT independent animation or a
 * newly created gameplay character class.
 */
export function OmegaSilverGuardReview({
 enabled,worldX=72,worldY=557,
}:{
 readonly enabled:boolean;
 readonly worldX?:number;
 readonly worldY?:number;
}){
 const [url,setUrl]=useState<string|null>(null);
 const [svgLoaded,setSvgLoaded]=useState(false);
 useEffect(()=>{
  if(!enabled){setUrl(null);setSvgLoaded(false);return;}
  let active=true;
  let lease:OmegaSilverPreviewSession|null=null;
  setUrl(null);setSvgLoaded(false);
  void omegaLoadSilverRepoReview().then(session=>{
   lease=session;
   if(!active){session.revoke();return;}
   const south=session.urls.get('S');
   if(!south)throw Error('Verified original silver AIRA south source unavailable');
   setUrl(south);
  }).catch(error=>{
   if(!active)return;
   lease?.revoke();lease=null;
   setUrl(null);setSvgLoaded(false);
   console.warn('Guard original AIRA visual preview unavailable; normal game unchanged',error);
  });
  return ()=>{active=false;lease?.revoke();};
 },[enabled]);
 if(!enabled||!url||!Number.isFinite(worldX)||!Number.isFinite(worldY))return null;
 return <g
  transform={`translate(${worldX} ${worldY})`}
  pointerEvents="none"
  data-omega-silver-guard-review={svgLoaded?'svg-loaded':'source-ready'}
  data-omega-silver-guard-heading="S"
  data-omega-silver-guard-role="noncombat-observer"
  aria-hidden="true"
 >
  <ellipse cx="0" cy="2" rx="20" ry="6" fill="#080d1c" opacity=".38"/>
  <ellipse cx="0" cy="2" rx="25" ry="9" fill="none" stroke="#b594fa" strokeWidth="1.3" opacity=".5"/>
  <image
   href={url}
   x="-25.5" y="-68" width="51" height="68"
   preserveAspectRatio="xMidYMax meet"
   onLoad={()=>setSvgLoaded(true)}
   onError={()=>{setUrl(null);setSvgLoaded(false);}}
   data-omega-silver-guard-source="sha256-verified-south"
  />
 </g>;
}
