import type {OmegaHeading} from './omega-protocol-actor-render';

/**
 * M12-G5b: a separate production-art review candidate, never an approved pack.
 * The previous SVG walking study failed VISUAL quality review; without four
 * original full-resolution painterly sources no replacement can draw.
 * This gate does not touch the stricter 160-frame / 320-mask art-slot gate.
 */
export const OMEGA_G5B_SOURCE_ROOT='/assets/omega/g5b/' as const;
export const OMEGA_G5B_EXPECTED_E_WALK=Object.freeze([
 OMEGA_G5B_SOURCE_ROOT+'aira-east-walk-0.webp',
 OMEGA_G5B_SOURCE_ROOT+'aira-east-walk-1.webp',
 OMEGA_G5B_SOURCE_ROOT+'aira-east-walk-2.webp',
 OMEGA_G5B_SOURCE_ROOT+'aira-east-walk-3.webp',
] as const);
export const OMEGA_G5B_ART_APPROVAL={
 status:'BLOCKED_NO_PAINTERLY_SOURCES',
 finalApprovedSourceFrameCount:0,
 finalApprovedMaskCount:0,
 currentlyInProduction:false,
} as const;
export type OmegaG5bReviewState='MISSING'|'REVIEWABLE_NOT_APPROVED';
export interface OmegaG5bPainterlyCandidate{
 readonly identity:'SILVER_AIRA_V2_E_WALK';
 readonly intent:'ARTIST_PAINTED_INDEPENDENT_FRAMES';
 readonly status:'REVIEW_ONLY';
 readonly productionApproved:false;
 readonly artistSignoff:string;
 readonly visualReview:'PASS';
 readonly widths:readonly [384,384,384,384];
 readonly heights:readonly [512,512,512,512];
 readonly paths:readonly string[];
 readonly sourceSha256:readonly string[];
 readonly independentlyPainted:true;
 readonly sourceAnchorSha256:string;
}
const sha=/^[a-f0-9]{64}$/;
export function omegaG5bLabRequested(search:string,isDevLab:boolean):boolean {
 if(!isDevLab)return false;
 const query=new URLSearchParams(search);
 return query.get('omegaLab')==='1'&&query.get('omegaM12G5b')==='1'&&
  !query.has('omegaSilverPreview')&&!query.has('omegaM12G5')&&
  !query.has('omegaM12G4')&&!query.has('omegaG5VectorStudy');
}
/**
 * Unique SHA paths / 384x512 manifest + signed off four-size art review
 * are necessary but NOT sufficient for 160-frame production approval.
 * Never accept previous SVG prototypes or fabricated repeated sources.
 * Absence of a signed candidate fails closed; the original eight
 * SHA-pinned neutral WebPs remain the only rendered silver art.
 */
export function omegaG5bReviewability(
 manifest:OmegaG5bPainterlyCandidate|null,
 pinnedOriginalEastHash:string,
):OmegaG5bReviewState {
 if(!manifest||!sha.test(pinnedOriginalEastHash))return 'MISSING';
 if(manifest.identity!=='SILVER_AIRA_V2_E_WALK'||
  manifest.intent!=='ARTIST_PAINTED_INDEPENDENT_FRAMES'||
  manifest.status!=='REVIEW_ONLY'||manifest.productionApproved!==false||
  manifest.independentlyPainted!==true||manifest.visualReview!=='PASS'||
  manifest.artistSignoff.trim().length<3||
  manifest.sourceAnchorSha256!==pinnedOriginalEastHash)return 'MISSING';
 const paths=manifest.paths,hashes=manifest.sourceSha256;
 if(paths.length!==4||hashes.length!==4||
  paths.some((path,i)=>path!==OMEGA_G5B_EXPECTED_E_WALK[i])||
  new Set(paths).size!==4||hashes.some(v=>!sha.test(v))||
  new Set(hashes).size!==4||
  manifest.widths.length!==4||manifest.heights.length!==4||
  manifest.widths.some(v=>v!==384)||manifest.heights.some(v=>v!==512)||
  hashes.includes(pinnedOriginalEastHash))return 'MISSING';
 return 'REVIEWABLE_NOT_APPROVED';
}
/** Intentional null: the four independently authored painterly E frames
 * have NOT yet passed human source and in-game composition review. */
export const OMEGA_G5B_SIGNED_PAINTERLY_CANDIDATE:OmegaG5bPainterlyCandidate|null=null;
export function omegaG5bNeverBypassProduction(_direction:OmegaHeading):false {
 return false;
}
