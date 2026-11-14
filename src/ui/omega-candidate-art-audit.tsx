import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {OMEGA_G5D_ACTUAL_E_WALK} from './omega-protocol-m12g5d-actual-source';
import type {OmegaG5cReviewProof} from './omega-protocol-m12g5c-local-art-review';

/** G5k: pixel-accurate review staging, never a gameplay transformation.
 * All sources are the file bytes already validated by the DEV importers.
 * A common reference height / anchor does NOT prove that the foot is correct.
 */
export interface OmegaVisualAuditFrame {
 readonly file:string;
 readonly imageUrl:string;
 readonly width:number;
 readonly height:number;
 readonly referenceHeight:number;
 readonly foot:Readonly<{x:number;y:number}>;
 readonly muzzle?:Readonly<{x:number;y:number}>;
 readonly alphaBounds?:Readonly<{minX:number;minY:number;maxX:number;maxY:number}>;
 readonly kind?:'source'|'candidate';
}
export const OMEGA_VISUAL_STAGE={width:360,height:350,pivotX:180,groundY:314,referencePixels:240} as const;

export function omegaVisualAuditLayout(
 frame:Pick<OmegaVisualAuditFrame,'width'|'height'|'referenceHeight'|'foot'>,
):Readonly<{left:number;top:number;width:number;height:number;scale:number}>{
 if(![frame.width,frame.height,frame.referenceHeight,frame.foot.x,frame.foot.y]
    .every(Number.isFinite)||frame.width<=0||frame.height<=0||
    frame.referenceHeight<=0||frame.foot.x<0||frame.foot.x>=frame.width||
    frame.foot.y<0||frame.foot.y>=frame.height)throw Error('검수 프레임 수치 또는 발 피벗 오류');
 const scale=OMEGA_VISUAL_STAGE.referencePixels/frame.referenceHeight;
 return {left:OMEGA_VISUAL_STAGE.pivotX-frame.foot.x*scale,
  top:OMEGA_VISUAL_STAGE.groundY-frame.foot.y*scale,
  width:frame.width*scale,height:frame.height*scale,scale};
}
export function omegaVisualAuditMarker(
 point:Readonly<{x:number;y:number}>,layout:ReturnType<typeof omegaVisualAuditLayout>,
):Readonly<{left:number;top:number}>{
 return {left:layout.left+point.x*layout.scale,top:layout.top+point.y*layout.scale};
}

export const OMEGA_VISUAL_AIRA_GROUPS=['fire','dash','hit'] as const;
export const OMEGA_VISUAL_SILVER_WALK_GROUPS=['walk'] as const;
/** Can only display the four actual repository G5d walk binaries after
 * the existing SHA256/decode/alpha importer has returned authentic proof.
 * Reference foot rows are ALPHA extents, not artist-approved true pivots. */
export function omegaVerifiedG5dWalkCards(proof:OmegaG5cReviewProof|null):readonly OmegaVisualAuditFrame[]{
 if(proof?.status!=='SESSION_PREVIEW_ONLY_NOT_ART_APPROVED'||
    proof.assets.length!==4||proof.artworkSignoff||proof.independentPaintedArtVerified)return [];
 for(let i=0;i<4;i++){
  const a=proof.assets[i],ref=OMEGA_G5D_ACTUAL_E_WALK[i]!;
  if(!a||a.file!==ref.file||a.sha256!==ref.sha256||
     a.width!==384||a.height!==512||
     !Number.isInteger(a.toeRow)||a.toeRow<480||a.toeRow>=512)return [];
 }
 return OMEGA_G5D_ACTUAL_E_WALK.map((ref,i)=>({
  file:ref.file,imageUrl:ref.path,width:384,height:512,
  referenceHeight:512,foot:{x:192,y:proof.assets[i]!.toeRow},
  kind:'source' as const,
 }));
}
export const OMEGA_VISUAL_INFECTED_GROUPS=['basic','runner','armored','elite'] as const;
export type OmegaVisualAuditMode='aira'|'infected'|'walk';
/** Exactly four distinct source filenames in native 0→1→2→3 order.
 * A header or a repeated image is not an additional painted frame. */
export function omegaVisualAuditGroupFrames(
 cards:readonly OmegaVisualAuditFrame[],mode:OmegaVisualAuditMode,group:string,
):readonly OmegaVisualAuditFrame[]{
 const allowed:readonly string[]=mode==='aira'?OMEGA_VISUAL_AIRA_GROUPS:
  mode==='walk'?OMEGA_VISUAL_SILVER_WALK_GROUPS:OMEGA_VISUAL_INFECTED_GROUPS;
 if(!allowed.includes(group))return [];
 const prefix=mode==='aira'||mode==='walk'?'aira-east-'+group+'-':group+'-';
 const filtered=cards.filter(card=>card.file.startsWith(prefix)&&/^[0-3]\.webp$/.test(card.file.slice(prefix.length)));
 if(filtered.length!==4)return [];
 const byIndex=new Map(filtered.map(card=>[Number(card.file.slice(prefix.length,prefix.length+1)),card]));
 if(byIndex.size!==4)return [];
 return [0,1,2,3].map(i=>byIndex.get(i)!);
}
export function omegaVisualAuditNextFrame(current:number,direction:-1|1):0|1|2|3{
 return (((Math.trunc(current)+direction+4)%4+4)%4) as 0|1|2|3;
}

const SILVER_REFERENCE:OmegaVisualAuditFrame={
 file:'G5d E-WALK 원본 후보 (기준)',
 imageUrl:'/assets/omega/g5d/aira-east-walk-0.webp',
 width:384,height:512,referenceHeight:512,foot:{x:192,y:486},kind:'source',
};

export function OmegaCandidateArtAudit({
 mode,cards,onClose,
}:{
 readonly mode:OmegaVisualAuditMode;
 readonly cards:readonly OmegaVisualAuditFrame[];
 readonly onClose:()=>void;
}){
 const [selectedGroup,setSelectedGroup]=useState<string>(mode==='aira'?'fire':mode==='walk'?'walk':'basic');
 const [selectedFrame,setSelectedFrame]=useState<0|1|2|3>(0);
 const closeRef=useRef<HTMLButtonElement>(null);
 useEffect(()=>{closeRef.current?.focus();},[]);
 const groups:readonly string[]=mode==='aira'?OMEGA_VISUAL_AIRA_GROUPS:
  mode==='walk'?OMEGA_VISUAL_SILVER_WALK_GROUPS:OMEGA_VISUAL_INFECTED_GROUPS;
 const frames=omegaVisualAuditGroupFrames(cards,mode,selectedGroup);
 const selected=frames[selectedFrame];
 const displayed=selected?(mode==='aira'?[SILVER_REFERENCE,selected]:[frames[0]!,selected]):[];
 const chooseGroup=(group:string)=>{setSelectedGroup(group);setSelectedFrame(0);};
 const advance=(dir:-1|1)=>setSelectedFrame(v=>omegaVisualAuditNextFrame(v,dir));
 return <section className="omega-art-audit-overlay" role="dialog" aria-modal="true"
  aria-label={mode==='aira'?'AIRA 전투 후보 실제 크기 비교':
   mode==='walk'?'SHA 검증된 AIRA E 걷기 원화 4장 실제 비교':'감염체 4종 16프레임 실제 크기 비교'}
  data-omega-g5k-audit={mode}
  onKeyDown={e=>{
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onClose();}
   else if(e.key==='Tab'){
    const focusable=Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    const first=focusable[0],last=focusable[focusable.length-1];
    if(e.shiftKey&&document.activeElement===first&&last){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last&&first){e.preventDefault();first.focus();}
   }
   else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
    e.preventDefault();e.stopPropagation();advance(e.key==='ArrowLeft'?-1:1);
   }
  }}>
   <header className="omega-art-audit-header">
    <div><strong>{mode==='aira'?'AIRA E · 전투 원화 12장 / 기존 걷기 기준':
      mode==='walk'?'AIRA E · SHA 검증 실제 걷기 원화 4장':'감염체 4종 · 동작 후보 16장'}</strong>
     <p>{mode==='walk'?'저장소 원본 G5d WebP 4장을 SHA-256·픽셀 검증 후 사용합니다. 발 기준은 불투명 픽셀 끝점 추정이므로 작화나 접지 승인 증거는 아닙니다.':'원본을 다시 그리지 않고 현재 로컬 세션에서 검증한 이미지 바이트로 표시합니다. 동일 기준 높이와 입력 앵커로만 정렬하며 미술 승인과 무관합니다.'}</p></div>
    <button type="button" ref={closeRef} onClick={onClose} aria-label="원화 비교 화면 닫기">게임으로 돌아가기 ×</button>
   </header>
   <nav className="omega-art-audit-groups" aria-label="원화 종류 선택">
    {groups.map(group=><button key={group} type="button" onClick={()=>chooseGroup(group)}
     aria-pressed={selectedGroup===group} data-omega-g5l-group={group}>
      {group.toUpperCase()}
     </button>)}
   </nav>
   <div className="omega-art-audit-stepper" data-omega-g5l-frame={selectedFrame}>
    <button type="button" onClick={()=>advance(-1)} aria-label="이전 원화 프레임">◀ 이전</button>
    <strong>{selectedGroup.toUpperCase()} · FRAME {selectedFrame} / 3</strong>
    <button type="button" onClick={()=>advance(1)} aria-label="다음 원화 프레임">다음 ▶</button>
    <small>버튼 또는 키보드 좌·우로 0~3프레임을 직접 전환합니다. 애니메이션·발접지 자동 승인 아님.</small>
   </div>
   <div className="omega-art-audit-strip" aria-label="원본 4프레임 선택">
    {frames.map((frame,i)=><button key={frame.file} type="button" className="omega-art-audit-strip-item"
     data-omega-g5l-pose={i} aria-pressed={selectedFrame===i}
     aria-label={selectedGroup+' 원화 '+i+'번'}
     onClick={()=>setSelectedFrame(i as 0|1|2|3)}>
     <img src={frame.imageUrl} alt="" decoding="async" draggable={false}/>
     <span>{i} · {frame.file}</span>
    </button>)}
   </div>
   <div className="omega-art-audit-legend">
    <span>가로 점선 = 가상 지면</span><span>노란 점 = 입력 발 피벗</span>
    <span>청록 점 = 입력 총구</span><span>표시 경계 = 실제 알파≥64 픽셀</span>
   </div>
   <div className="omega-art-audit-grid">
    {displayed.map((frame,slot)=>{
     const layout=omegaVisualAuditLayout(frame);
     const imageStyle:CSSProperties={left:layout.left,top:layout.top,width:layout.width,height:layout.height};
     const muzzle=frame.muzzle?omegaVisualAuditMarker(frame.muzzle,layout):null;
     return <figure key={slot+'-'+frame.file} className="omega-art-audit-card" data-omega-g5k-frame={frame.file}>
      <figcaption><strong>{frame.file}</strong>
       <small>{frame.width}×{frame.height} · 기준높이 {frame.referenceHeight}px</small></figcaption>
      <div className="omega-art-audit-stage">
       <div className="omega-art-audit-floor" aria-hidden="true"/>
       <div className="omega-art-audit-axis" aria-hidden="true"/>
       <img src={frame.imageUrl} style={imageStyle} alt={frame.file+' 실제 후보 원화'}
        decoding="async" draggable={false}/>
       <i className="omega-art-audit-foot" aria-label="입력 발 좌표"/>
       {muzzle&&<i className="omega-art-audit-muzzle"
         style={{left:muzzle.left,top:muzzle.top}} aria-label="입력 총구 좌표"/>}
      </div>
      <p>발 ({frame.foot.x}, {frame.foot.y})
       {frame.muzzle?' · 총구 ('+frame.muzzle.x+', '+frame.muzzle.y+')':''}
       {frame.alphaBounds?' · 보이는 경계 Y '+frame.alphaBounds.minY+'–'+frame.alphaBounds.maxY:''}
      </p>
     </figure>;
    })}
   </div>
   <footer>왼쪽 기준 이미지와 오른쪽 선택 자세를 같은 지면·축척에서 비교하세요. 질주형 손/부츠 접지와 공중 자세의 가상 지면은 별도 사람 판정이 필요합니다. 상단 이미지와 피벗은 세션이 닫히면 폐기됩니다. 정식 캐릭터·적 자산과 전투 판정·저장·해금은 변경하지 않습니다. 원화/접지/방향 품질의 사람 검수는 계속 필요합니다.</footer>
  </section>;
}
