import type {CSSProperties} from 'react';

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

const SILVER_REFERENCE:OmegaVisualAuditFrame={
 file:'G5d E-WALK 원본 후보 (기준)',
 imageUrl:'/assets/omega/g5d/aira-east-walk-0.webp',
 width:384,height:512,referenceHeight:512,foot:{x:192,y:486},kind:'source',
};

export function OmegaCandidateArtAudit({
 mode,cards,onClose,
}:{
 readonly mode:'aira'|'infected';
 readonly cards:readonly OmegaVisualAuditFrame[];
 readonly onClose:()=>void;
}){
 const displayed=mode==='aira'?[SILVER_REFERENCE,...cards]:cards;
 return <section className="omega-art-audit-overlay" role="dialog" aria-modal="true"
  aria-label={mode==='aira'?'AIRA 전투 후보 실제 크기 비교':'감염체 4종 16프레임 실제 크기 비교'}
  data-omega-g5k-audit={mode}>
   <header className="omega-art-audit-header">
    <div><strong>{mode==='aira'?'AIRA E · 전투 원화 12장 / 기존 걷기 기준':'감염체 4종 · 동작 후보 16장'}</strong>
     <p>원본을 다시 그리지 않고 현재 로컬 세션에서 검증한 이미지 바이트로 표시합니다. 동일 기준 높이와 입력 앵커로만 정렬하며 미술 승인과 무관합니다.</p></div>
    <button type="button" onClick={onClose} aria-label="원화 비교 화면 닫기">게임으로 돌아가기 ×</button>
   </header>
   <div className="omega-art-audit-legend">
    <span>가로 점선 = 가상 지면</span><span>노란 점 = 입력 발 피벗</span>
    <span>청록 점 = 입력 총구</span><span>표시 경계 = 실제 알파≥64 픽셀</span>
   </div>
   <div className="omega-art-audit-grid">
    {displayed.map(frame=>{
     const layout=omegaVisualAuditLayout(frame);
     const imageStyle:CSSProperties={left:layout.left,top:layout.top,width:layout.width,height:layout.height};
     const muzzle=frame.muzzle?omegaVisualAuditMarker(frame.muzzle,layout):null;
     return <figure key={frame.file} className="omega-art-audit-card" data-omega-g5k-frame={frame.file}>
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
   <footer>상단 이미지와 피벗은 세션이 닫히면 폐기됩니다. 정식 캐릭터·적 자산과 전투 판정·저장·해금은 변경하지 않습니다. 원화/접지/방향 품질의 사람 검수는 계속 필요합니다.</footer>
  </section>;
}
