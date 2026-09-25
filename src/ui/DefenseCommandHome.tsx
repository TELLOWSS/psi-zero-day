import { useEffect, useMemo, useState } from 'react';
import type { EpisodeSession } from '../app/episode-session';
import { COMPANY_NAME, GAME_TITLE } from '../app/brand';
import { inspectDefenseSave } from '../app/defense-save';
import { defenseBoardArtUri } from '../app/defense-visual-assets';
import { zeroBreachContent } from '../content/defense';
import type { DefenseRunState } from '../domain/defense';
import { browserLocalStoragePort } from '../platform/browser-storage';
import { VisualImage } from './VisualSlot';


function CommandIcon({ kind }: { kind: 'play' | 'journal' | 'people' | 'guide' }) {
  const paths = {
    play: 'm8 4 12 8-12 8Z',
    journal: 'M6 3h14v18H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm0 0v18m4-13h6m-6 4h6m-6 4h4',
    people: 'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 10v-3a6 6 0 0 1 12 0v3m3-17a4 4 0 0 1 0 8m1 3a5 5 0 0 1 4 5v1',
    guide: 'M12 5C8 2 4 3 2 4v16c3-2 6-2 10 0 4-2 7-2 10 0V4c-3-1-6-2-10 1Zm0 0v15',
  } as const;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]} /></svg>;
}

interface DefenseHomeSnapshot {
  readonly activeRun: DefenseRunState | null;
  readonly finishedRuns: number;
  readonly bestCompletedWaves: number;
  readonly status: 'loading' | 'ready' | 'empty' | 'error';
}

const EMPTY: DefenseHomeSnapshot = {
  activeRun: null,
  finishedRuns: 0,
  bestCompletedWaves: 0,
  status: 'loading',
};

function riskLabel(id: string) {
  if (id === 'SWIFT') return '빠르게 변하는 이동위험';
  if (id === 'VEILED') return '보이지 않는 상태·정보';
  if (id === 'SWARM') return '동시작업·동선 혼잡';
  if (id === 'ARMORED') return '구조·중량·고관성 위험';
  if (id === 'BOSS') return '복합 중대상황';
  return '눈에 보이는 일상 위험';
}

function liveSignals(run: DefenseRunState | null): readonly string[] {
  if (!run) return ['SWIFT', 'VEILED', 'SWARM'];
  const counts = new Map<string, number>();
  for (const enemy of run.enemies) counts.set(enemy.enemyId, (counts.get(enemy.enemyId) ?? 0) + 1);
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  for (const fallback of ['SWIFT', 'VEILED', 'SWARM']) if (!ranked.includes(fallback)) ranked.push(fallback);
  return ranked.slice(0, 3);
}

export function DefenseCommandHome({
  session,
  canContinueStory,
  storyProgress,
  onDefense,
  onStory,
  onNewStory,
  onJournal,
  onPeople,
  onGuide,
  onSettings,
}: {
  readonly session: EpisodeSession;
  readonly canContinueStory: boolean;
  readonly storyProgress: number;
  readonly onDefense: () => void;
  readonly onStory: () => void;
  readonly onNewStory: () => void;
  readonly onJournal: () => void;
  readonly onPeople: () => void;
  readonly onGuide: () => void;
  readonly onSettings: () => void;
}) {
  const [home, setHome] = useState<DefenseHomeSnapshot>(EMPTY);
  const board = defenseBoardArtUri(zeroBreachContent.map.id) ?? session.assetUri('ep01.background.foundation.map');

  useEffect(() => {
    let cancelled = false;
    void inspectDefenseSave(browserLocalStoragePort(), zeroBreachContent)
      .then(inspection => {
        if (cancelled) return;
        if (inspection.kind === 'ready' || inspection.kind === 'version-mismatch' || inspection.kind === 'empty') {
          const records = inspection.document.records;
          setHome({
            activeRun: inspection.document.activeRun,
            finishedRuns: records.reduce((sum, record) => sum + record.finishedRuns, 0),
            bestCompletedWaves: records.reduce((best, record) => Math.max(best, record.bestCompletedWaves), 0),
            status: inspection.document.activeRun ? 'ready' : records.length ? 'ready' : 'empty',
          });
          return;
        }
        setHome(current => ({ ...current, status: 'error' }));
      })
      .catch(() => {
        if (!cancelled) setHome(current => ({ ...current, status: 'error' }));
      });
    return () => { cancelled = true; };
  }, []);

  const signals = useMemo(() => liveSignals(home.activeRun), [home.activeRun]);
  const active = home.activeRun;
  const defenseCta = active ? '현장 디펜스 이어하기' : '현장 디펜스 시작';
  const defenseHint = active
    ? `WAVE ${active.waveId} / 10 · 보호막 ${Math.round(active.shield)} · 현장 상태 이어짐`
    : '약한 신호를 읽고 개입해 현장 자체를 바꾸는 본편 플레이';

  return <main className="defense-command-home" data-home-mode="DEFENSE_FIRST">
    {board ? <VisualImage uri={board} alt="" className="defense-command-backdrop" /> : null}
    <div className="defense-command-grade" aria-hidden="true" />
    <div className="defense-command-grid" aria-hidden="true" />

    <header className="defense-command-top">
      <div className="defense-command-brand">
        <small>NEW PSI · FIELD COMMAND</small>
        <strong>{GAME_TITLE}</strong>
        <span>{COMPANY_NAME}</span>
      </div>
      <nav className="defense-command-utility" aria-label="보조 메뉴">
        <button type="button" onClick={onJournal}><CommandIcon kind="journal" /><span>기록</span></button>
        <button type="button" onClick={onPeople}><CommandIcon kind="people" /><span>인물</span></button>
        <button type="button" onClick={onGuide}><CommandIcon kind="guide" /><span>현장도감</span></button>
        <button type="button" onClick={onSettings}><span aria-hidden="true">⚙</span><span>설정</span></button>
      </nav>
    </header>

    <section className="defense-command-hero">
      <span className="defense-command-kicker">PROACTIVE SAFETY INTELLIGENCE</span>
      <h1>현장을 읽고,<br/><em>사고 전에 바꾼다.</em></h1>
      <p className="defense-command-definition">사고 전 신호를 모아 다음 위험을 먼저 읽는 안전지능.</p>
      <p className="defense-command-body">사람·차량·공정·압박이 동시에 움직이는 현장에서 신호를 읽고, 개입하고, 그 결과가 다음 위험을 바꾸게 하십시오.</p>

      <div className="defense-command-actions">
        <button className="defense-command-primary" type="button" onClick={onDefense}>
          <span className="defense-command-action-icon"><CommandIcon kind="play" /></span>
          <span><strong>{defenseCta}</strong><small>{defenseHint}</small></span>
          <b aria-hidden="true">›</b>
        </button>
        <button className="defense-command-secondary" type="button" onClick={canContinueStory ? onStory : onNewStory}>
          <span><strong>{canContinueStory ? '스토리 이어가기' : '스토리 시작'}</strong><small>사람관계 · 사건 · 판단의 맥락을 이어갑니다.</small></span>
          {canContinueStory ? <em>EP.01 · {storyProgress}%</em> : null}
        </button>
      </div>
    </section>

    <aside className="defense-command-ops" aria-label="현재 현장 상태">
      <header><small>LIVE SITE</small><strong>RAMP-01 · WEST GATE</strong><span>LOGISTICS / DEF-CORE-01</span></header>
      <div className="defense-command-run">
        <span>현재 진행</span>
        <strong>{active ? `WAVE ${active.waveId} / 10` : '새 현장 준비'}</strong>
        <small>{active ? `${active.status} · 완료 Wave ${active.completedWaves}` : `최고 진행 ${home.bestCompletedWaves} Wave · 완료 Run ${home.finishedRuns}`}</small>
      </div>
      <div className="defense-command-signals">
        <span>PSI · CURRENT SIGNALS</span>
        {signals.map((id, index) => <article key={id}>
          <b>{String(index + 1).padStart(2, '0')}</b>
          <div><strong>{id}</strong><small>{riskLabel(id)}</small></div>
        </article>)}
      </div>
      <footer><span>WORLD FIRST</span><span>IMPACT FIRST</span><span>MOBILE FIRST</span></footer>
    </aside>

    <section className="defense-command-dock" aria-label="게임 영역">
      <button type="button" onClick={onDefense}>
        <small>PLAY</small><strong>현장 디펜스</strong><span>신호 → 판단 → 개입 → 현장 변화</span>
      </button>
      <button type="button" onClick={onStory}>
        <small>STORY</small><strong>사람과 사건</strong><span>현장의 사정과 선택의 책임</span>
      </button>
      <button type="button" onClick={onGuide}>
        <small>FIELD GUIDE</small><strong>현장도감</strong><span>공정·장비·위험을 실제 맥락으로</span>
      </button>
      <div className="defense-command-next">
        <small>NEXT SITE SYSTEM</small><strong>현장 · 공법 · 공정에 따라 위험이 달라집니다.</strong>
        <span>공동주택 신축 · 순타/역타 · 리모델링 · 데이터센터</span>
      </div>
    </section>
  </main>;
}
