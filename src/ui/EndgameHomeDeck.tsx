import type {EndgameHomeStatus} from '../app/endgame-home';
import {SIGNAL_WATCH_KEY_ART} from './signal-watch-art';
import {DEFENSE_PREMIUM_HERO} from '../app/defense-premium-art';

export function EndgameHomeDeck({status,onGuard,onWatch}:{status:EndgameHomeStatus;onGuard?:()=>void;onWatch?:()=>void}){
 return <section className="hub-endgame-deck" id="psi-endgame-deck" aria-label="시그널 가드·워치 엔드게임 업데이트" data-veteran={status.veteran}>
  <header className="hub-endgame-deck-head">
   <div><small>PSI : ZERO DAY / RE:IGNITION · 2026.11</small><h2>{status.veteran?'완주한 당신을 위한 새로운 작전.':'두 개의 전선, 새롭게 달라진 도전.'}</h2><p>{status.veteran?'최고 장비보다 중요한 것은 위험을 읽는 판단입니다. 기록은 그대로, 공략의 깊이는 새롭게.':'시그널 가드와 시그널 워치에 각각 다른 마스터 공략과 전술적 대응을 더했습니다.'}</p></div>
   <span className="hub-endgame-edition" aria-label="엔드게임 업데이트">ENDGAME<small>EDITION 2026.11</small></span>
  </header>
  <div className="hub-endgame-duo">
   <article className="hub-endgame-card is-guard" data-game="guard">
    <img src={`/${DEFENSE_PREMIUM_HERO}`} alt="" loading="lazy" decoding="async"/>
    <div className="hub-endgame-card-content"><small>01 / TACTICAL DEFENSE</small><h3>SIGNAL GUARD</h3>
      <p>적의 강점에 맞춰 방어선을 다시 설계하라. 위험 집중·실드 페널티·마스터 별도 기록.</p>
      <div className="hub-endgame-progress"><strong>{status.guardClears}<span>/6 CLEAR</span></strong><span>{status.guardUnlocked?`마스터 ★★★ ${status.guardMastered}/6`:'6개 작전 완료 시 마스터 해금'}</span></div>
      <progress aria-label="시그널 가드 완료 작전" max={6} value={status.guardClears}/>
      <button type="button" disabled={!onGuard} onClick={onGuard}>{status.guardUnlocked?'마스터 작전 선택':'가드 작전 입장'} <span aria-hidden="true">→</span></button>
    </div>
   </article>
   <article className="hub-endgame-card is-watch" data-game="watch">
    <img src={SIGNAL_WATCH_KEY_ART} alt="" loading="lazy" decoding="async"/>
    <div className="hub-endgame-card-content"><small>02 / SURVIVORS</small><h3>SIGNAL WATCH</h3>
      <p>50개 현장의 새 변칙 위험. 보스의 경고를 읽고, 움직이며 약점을 공략하라.</p>
      <div className="hub-endgame-progress"><strong>{status.watchClears}<span>/50 CLEAR</span></strong><span>{status.watchUnlocked?`마스터 ★★★ ${status.watchMastered}/50`:'50개 스테이지 완료 시 마스터 해금'}</span></div>
      <progress aria-label="시그널 워치 완료 스테이지" max={50} value={status.watchClears}/>
      <button type="button" disabled={!onWatch} onClick={onWatch}>{status.watchUnlocked?'마스터 도전 준비':'워치 스테이지 선택'} <span aria-hidden="true">→</span></button>
    </div>
   </article>
  </div>
  <details className="hub-endgame-release" aria-label="2026년 11월 게임 업데이트의 핵심 변경사항">
   <summary>이번 업데이트, 무엇이 달라졌나요? <span aria-hidden="true">+</span></summary>
   <div className="hub-endgame-release-grid">
    <section><small>GUARD / TACTICS</small><strong>상대에 맞춰 다시 짜는 방어</strong><p>마스터 작전은 웨이브마다 주요 위험과 실드 손실 기준을 알리고, 일반 기록과 별도로 평가합니다.</p></section>
    <section><small>WATCH / SURVIVAL</small><strong>최고 성장 이후의 새 공략</strong><p>50개 스테이지 완주 시 새 마스터 난이도가 열립니다. 장비 화력 외에 패턴 회피와 위치 판단을 요구합니다.</p></section>
    <section><small>RECORD / PROGRESS</small><strong>진행 기록을 이어서</strong><p>기존 클리어와 성장 기록을 유지합니다. 홈 작전판에는 각 모드의 실제 달성 현황만 표시합니다.</p></section>
   </div>
  </details>
  <p className="hub-endgame-disclaimer">실제 클리어 기록으로 진행도를 표시합니다. 마스터 도전은 각 모드의 기존 클리어 조건을 달성한 경우에만 선택할 수 있습니다.</p>
 </section>;
}
