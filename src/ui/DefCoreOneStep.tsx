import { useEffect, useMemo, useRef, useState } from 'react';
import contractRaw from '../../content/defense/def-core-01.json';
import type { DefenseRunState } from '../domain/defense';
import { defensePositionAtDistance } from '../engine/defense';
import { VisualImage } from './VisualSlot';
import type { DefenseAudioCue } from './useDefenseAudio';

type OneStepPhase =
  | 'IDLE'
  | 'SIGNAL'
  | 'READ'
  | 'IMPACT'
  | 'CINEMATIC'
  | 'DECISION'
  | 'RETURN'
  | 'HOOK'
  | 'DONE';

type OneStepChoice = 'A' | 'B' | 'C';
type OneStepFollowup = 'ASK' | 'RECORD' | 'TOMORROW';

interface OneStepPersisted {
  readonly phase: OneStepPhase;
  readonly shotIndex: number;
  readonly choice: OneStepChoice | null;
  readonly followup: OneStepFollowup | null;
}

interface OneStepContract {
  readonly scope: {
    readonly scenarioId: string;
    readonly representativeWave: number;
    readonly riskId: 'SWIFT';
    readonly responseId: 'CONTROL';
  };
  readonly trigger: {
    readonly minDistance: number;
    readonly maxDistance: number;
  };
  readonly cinematic: {
    readonly shots: readonly { readonly id: string; readonly focus: string }[];
    readonly dialogue: { readonly speaker: string; readonly line: string };
  };
  readonly choices: readonly {
    readonly id: OneStepChoice;
    readonly label: string;
    readonly worldResult: 'HOLD_LINE' | 'REINFORCED_CONTROL' | 'REROUTED_STAGING';
    readonly tradeoff: string;
  }[];
  readonly hook: {
    readonly speaker: string;
    readonly line: string;
    readonly followups: readonly string[];
  };
}

const contract = contractRaw as OneStepContract;
const SHOT_MS = 2100;
const CORE_PATH = [[0,300],[180,300],[180,150],[450,150],[450,450],[720,450],[720,240],[1000,240]] as const;

function storageKey(runId: string) {
  return `psi-zero-day.def-core-01.${runId}`;
}

function readPersisted(runId: string): OneStepPersisted | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(runId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OneStepPersisted>;
    if (!parsed.phase) return null;
    return {
      phase: parsed.phase,
      shotIndex: Number.isInteger(parsed.shotIndex) ? Number(parsed.shotIndex) : 0,
      choice: parsed.choice ?? null,
      followup: parsed.followup ?? null,
    };
  } catch {
    return null;
  }
}

function writePersisted(runId: string, value: OneStepPersisted) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(storageKey(runId), JSON.stringify(value));
  } catch {
    // Presentation continuity only; never block gameplay.
  }
}

function assetUrl(uri: string) {
  return `${import.meta.env.BASE_URL}${uri.replace(/^\/?(?:public\/)?/, '')}`;
}

function playOneShotAsset(uri: string, muted: boolean) {
  if (muted || typeof window === 'undefined') return;
  try {
    const audio = new Audio(assetUrl(uri));
    audio.volume = 0.42;
    void audio.play().catch(() => undefined);
  } catch {
    // Audio must never block the event.
  }
}

export interface DefCoreOneStepController {
  readonly eligible: boolean;
  readonly active: boolean;
  readonly phase: OneStepPhase;
  readonly shotIndex: number;
  readonly choice: OneStepChoice | null;
  readonly followup: OneStepFollowup | null;
  readonly choiceResult: OneStepContract['choices'][number] | null;
  readonly focusSignal: () => void;
  readonly applyControl: () => void;
  readonly choose: (choice: OneStepChoice) => void;
  readonly finishHook: (followup: OneStepFollowup) => void;
}

export function useDefCoreOneStep({
  state,
  onPause,
  playCue,
  muted,
}: {
  readonly state: DefenseRunState | null;
  readonly onPause: (paused: boolean) => void;
  readonly playCue: (cue: DefenseAudioCue) => void;
  readonly muted: boolean;
}): DefCoreOneStepController {
  const hydratedRunRef = useRef<string | null>(null);
  const [phase, setPhase] = useState<OneStepPhase>('IDLE');
  const [shotIndex, setShotIndex] = useState(0);
  const [choice, setChoice] = useState<OneStepChoice | null>(null);
  const [followup, setFollowup] = useState<OneStepFollowup | null>(null);

  useEffect(() => {
    if (!state || hydratedRunRef.current === state.runId) return;
    hydratedRunRef.current = state.runId;
    const saved = readPersisted(state.runId);
    setPhase(saved?.phase ?? 'IDLE');
    setShotIndex(saved?.shotIndex ?? 0);
    setChoice(saved?.choice ?? null);
    setFollowup(saved?.followup ?? null);
  }, [state]);

  useEffect(() => {
    if (!state || hydratedRunRef.current !== state.runId) return;
    writePersisted(state.runId, { phase, shotIndex, choice, followup });
  }, [choice, followup, phase, shotIndex, state]);

  const eligible = Boolean(
    state
      && state.scenarioId === contract.scope.scenarioId
      && state.waveId === contract.scope.representativeWave,
  );

  useEffect(() => {
    if (!state || !eligible || phase !== 'IDLE' || state.status !== 'RUNNING' || state.paused) return;
    const swift = state.enemies.find(enemy => enemy.enemyId === contract.scope.riskId
      && enemy.distance >= contract.trigger.minDistance
      && enemy.distance <= contract.trigger.maxDistance);
    if (!swift) return;

    onPause(true);
    playCue('warning');
    playOneShotAsset('assets/episode01/audio/gate-queue.ogg', muted);
    setPhase('SIGNAL');
  }, [eligible, muted, onPause, phase, playCue, state]);

  useEffect(() => {
    if (phase !== 'IMPACT') return;
    playCue('support');
    playOneShotAsset('assets/episode01/audio/stopwork-silence-drop.ogg', muted);
    const timer = window.setTimeout(() => {
      setShotIndex(0);
      setPhase('CINEMATIC');
    }, 900);
    return () => window.clearTimeout(timer);
  }, [muted, phase, playCue]);

  useEffect(() => {
    if (phase !== 'CINEMATIC') return;
    if (shotIndex === 4) {
      playCue('select');
      playOneShotAsset('assets/episode01/audio/radio-burst.ogg', muted);
    }
    if (shotIndex === 5) playCue('area_resolve');

    const timer = window.setTimeout(() => {
      if (shotIndex >= contract.cinematic.shots.length - 1) {
        setPhase('DECISION');
        return;
      }
      setShotIndex(index => index + 1);
    }, SHOT_MS);
    return () => window.clearTimeout(timer);
  }, [muted, phase, playCue, shotIndex]);

  useEffect(() => {
    if (phase !== 'RETURN') return;
    const timer = window.setTimeout(() => setPhase('HOOK'), 1300);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const choiceResult = useMemo(
    () => contract.choices.find(item => item.id === choice) ?? null,
    [choice],
  );

  return {
    eligible,
    active: phase !== 'IDLE' && phase !== 'DONE',
    phase,
    shotIndex,
    choice,
    followup,
    choiceResult,
    focusSignal: () => {
      if (phase !== 'SIGNAL') return;
      playCue('select');
      setPhase('READ');
    },
    applyControl: () => {
      if (phase !== 'READ') return;
      setPhase('IMPACT');
    },
    choose: selected => {
      if (phase !== 'DECISION') return;
      setChoice(selected);
      playCue('select');
      setPhase('RETURN');
    },
    finishHook: selected => {
      if (phase !== 'HOOK') return;
      setFollowup(selected);
      setPhase('DONE');
      onPause(false);
      playCue('support');
    },
  };
}

export function DefCoreOneStepBoardOverlay({
  state,
  controller,
}: {
  readonly state: DefenseRunState;
  readonly controller: DefCoreOneStepController;
}) {
  const showIntervention = ['IMPACT','CINEMATIC','DECISION','RETURN','HOOK','DONE'].includes(controller.phase);
  if (!showIntervention && !controller.choice) return null;

  const swift = state.enemies.find(enemy => enemy.enemyId === 'SWIFT');
  const swiftPos = swift ? defensePositionAtDistance(CORE_PATH, swift.distance) : { x: 92, y: 300 };
  const worldResult = controller.choiceResult?.worldResult ?? null;

  return <g className="def-core-world" data-def-core-world={worldResult ?? 'CONTROL_ACTIVE'} aria-hidden="true">
    <circle cx={swiftPos.x} cy={swiftPos.y} r={worldResult ? 38 : 58} className="def-core-risk-zone" />
    <polyline
      points={worldResult === 'REROUTED_STAGING' ? '18,356 80,356 80,215 188,215' : '18,356 92,356 92,242 180,242'}
      className="def-core-ped-route"
      fill="none"
    />
    <line x1={worldResult === 'HOLD_LINE' ? 58 : 86} y1="276" x2={worldResult === 'HOLD_LINE' ? 58 : 86} y2="326" className="def-core-hold-line" />
    <image
      href="assets/episode01/scene-elements/vehicle-pedestrian-separation.webp"
      x="26"
      y="190"
      width="286"
      height="205"
      preserveAspectRatio="xMidYMid meet"
      className="def-core-barrier def-core-separation"
    />
    <image
      href="assets/episode01/characters/choi-minseok-map.webp"
      x="126"
      y="205"
      width="58"
      height="88"
      preserveAspectRatio="xMidYMid meet"
      className="def-core-marshal"
    />
    {worldResult === 'REINFORCED_CONTROL' ? <image
      href="assets/episode01/characters/choi-minseok-map.webp"
      x="205"
      y="224"
      width="54"
      height="82"
      preserveAspectRatio="xMidYMid meet"
      className="def-core-marshal is-secondary"
    /> : null}
  </g>;
}

const SHOT_VISUALS = [
  { uri: 'assets/episode01/cg/gate-dawn.webp', alt: '차량과 보행자가 교차하는 서측 게이트 전경' },
  { uri: 'assets/episode01/characters/lim-junho-concerned.webp', alt: '멈춰 선 임준호' },
  { uri: 'assets/episode01/cg/ramp-entry.webp', alt: '후진 차량 후미와 제한된 진입 동선' },
  { uri: 'assets/episode01/characters/choi-minseok-map.webp', alt: '정지 신호를 보내는 최민석' },
  { uri: 'assets/episode01/characters/player-portrait.webp', alt: '무전으로 개입하는 플레이어' },
  { uri: 'assets/episode01/characters/lee-jaehoon-portrait.webp', alt: '현장에 도착한 이재훈' },
] as const;

const SHOT_COPY = [
  ['WIDE', '후진 차량과 보행 동선이 한 지점으로 겹친다.'],
  ['FOCUS', '임준호가 진흙과 자재 앞에서 한 걸음을 멈춘다.'],
  ['REAR', '차량 후미. 운전석에서는 보행 통로가 완전히 보이지 않는다.'],
  ['SIGNAL', '최민석이 손을 올린다. 거리는 아직 멀다.'],
  ['RADIO', '“잠깐, 잠깐!” 무전이 열린다.'],
  ['BRAKE', '0.2초의 정적. 차량이 멈추고 현장 소리가 다시 들어온다.'],
] as const;

export function DefCoreOneStepOverlay({
  controller,
}: {
  readonly controller: DefCoreOneStepController;
}) {
  if (controller.phase === 'IDLE' || controller.phase === 'DONE') return null;

  if (controller.phase === 'SIGNAL') return <section className="def-core-overlay def-core-signal" role="dialog" aria-modal="true" data-def-core-phase="SIGNAL">
    <div className="def-core-signal-card">
      <small>PSI · WEAK SIGNAL</small>
      <strong>삐— 삐— 후진경고음이 가까워진다.</strong>
      <p>큰 경고는 아직 없습니다. 서측 Gate에서 한 사람이 걸음을 늦췄습니다.</p>
      <button type="button" onClick={controller.focusSignal}>서측 Gate 집중해서 보기</button>
    </div>
  </section>;

  if (controller.phase === 'READ') return <section className="def-core-overlay def-core-read" role="dialog" aria-modal="true" data-def-core-phase="READ">
    <div className="def-core-read-panel">
      <small>READ · P1/P2 WEST GATE</small>
      <h2>차량과 사람이 같은 틈을 보고 있습니다.</h2>
      <ul>
        <li>후진 차량이 보행 통로 쪽으로 접근</li>
        <li>자재가 통로 일부를 침범</li>
        <li>최민석의 신호 위치에서 운전석 시야 제한</li>
        <li>임준호가 피할 방향이 모호함</li>
      </ul>
      <div className="def-core-confirm"><b>SWIFT CONFIRMED</b><span>빠르게 변하는 이동위험</span></div>
      <button type="button" onClick={controller.applyControl}>CONTROL · 유도원 + 보행동선 분리</button>
    </div>
  </section>;

  if (controller.phase === 'IMPACT' || controller.phase === 'RETURN') return <section
    className={`def-core-overlay def-core-impact is-${controller.phase.toLowerCase()}`}
    role="status"
    data-def-core-phase={controller.phase}
  >
    <div>
      <small>{controller.phase === 'IMPACT' ? 'CONTROL INTERVENTION' : 'RETURN TO DEFENSE'}</small>
      <strong>{controller.phase === 'IMPACT' ? '차량 감속 · 유도원 이동 · 통로 분리' : '선택한 조치가 현장에 남았습니다.'}</strong>
      {controller.choiceResult ? <span>{controller.choiceResult.label}</span> : null}
    </div>
  </section>;

  if (controller.phase === 'CINEMATIC') {
    const visual = SHOT_VISUALS[controller.shotIndex] ?? SHOT_VISUALS[0];
    const copy = SHOT_COPY[controller.shotIndex] ?? SHOT_COPY[0];
    return <section className="def-core-overlay def-core-cinematic" role="dialog" aria-modal="true" data-def-core-phase="CINEMATIC" data-def-core-shot={copy[0]}>
      <div className="def-core-letterbox">
        <VisualImage uri={visual.uri} alt={visual.alt} className="def-core-shot-image" />
        <div className="def-core-shot-shade" />
        <div className="def-core-shot-copy">
          <small>{copy[0]} · 한 걸음</small>
          <p>{copy[1]}</p>
          {controller.shotIndex === 5 ? <blockquote><b>{contract.cinematic.dialogue.speaker}</b> “{contract.cinematic.dialogue.line}”</blockquote> : null}
        </div>
        <div className="def-core-shot-progress">
          {contract.cinematic.shots.map((shot, index) => <i key={shot.id} className={index <= controller.shotIndex ? 'is-on' : ''} />)}
        </div>
      </div>
    </section>;
  }

  if (controller.phase === 'DECISION') return <section className="def-core-overlay def-core-decision" role="dialog" aria-modal="true" data-def-core-phase="DECISION">
    <div className="def-core-decision-card">
      <div className="def-core-speaker">
        <VisualImage uri="assets/episode01/characters/lee-jaehoon-portrait.webp" alt="이재훈" className="def-core-speaker-image" />
        <span><small>공정 담당 · 이재훈</small><strong>“차를 세우면 뒤에 두 대가 밀립니다.”</strong></span>
      </div>
      <h2>안전은 확보합니다. 어떻게 운영할까요?</h2>
      <div className="def-core-choice-grid">
        {contract.choices.map(item => <button key={item.id} type="button" onClick={() => controller.choose(item.id)}>
          <b>{item.id}</b><span>{item.label}</span><small>{item.tradeoff}</small>
        </button>)}
      </div>
    </div>
  </section>;

  if (controller.phase === 'HOOK') return <section className="def-core-overlay def-core-hook" role="dialog" aria-modal="true" data-def-core-phase="HOOK">
    <div className="def-core-hook-card">
      <VisualImage uri="assets/episode01/characters/lim-junho-concerned.webp" alt="임준호" className="def-core-hook-image" />
      <div>
        <small>임준호 · 작업자</small>
        <blockquote>“{contract.hook.line}”</blockquote>
        <p>오늘 조치는 끝났지만, 같은 위치의 작은 신호가 반복되고 있습니다.</p>
        <div className="def-core-hook-actions">
          <button type="button" onClick={() => controller.finishHook('ASK')}>더 묻기</button>
          <button type="button" onClick={() => controller.finishHook('RECORD')}>기록하기</button>
          <button type="button" onClick={() => controller.finishHook('TOMORROW')}>내일 확인</button>
        </div>
      </div>
    </div>
  </section>;

  return null;
}
