/** @vitest-environment jsdom */
import fs from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { StrategyView } from '../src/app/strategy-view';
import { EpisodeImmersiveScene, episode01Stage3VisualLock } from '../src/ui/EpisodeImmersiveScene';
import { StrategyMapShell } from '../src/ui/StrategyMapShell';

const resolve = (assetId: string) => `/assets/mock/${assetId}.webp`;
const t = (id: string) => id;

const copy = {
  brand: 'PSI : ZERO DAY',
  day: 'DAY',
  stage: 'STAGE',
  psi: 'PSI',
  objectives: 'OBJECTIVES',
  assignments: 'ASSIGNMENTS',
  roster: 'ROSTER',
  site: 'SITE',
  events: 'SIGNALS',
  progress: 'PROGRESS',
  pressures: 'FIELD PRESSURE',
  focus: 'FOCUS',
  focusHint: '대상을 선택하세요.',
  actions: '현장 행동',
  actionHint: '대상을 선택하세요.',
};

const strategyView = {
  clock: { day: 1, slot: 'MORNING' },
  construction: { stage_id: 'FOUNDATION', current_stage_progress: 15, progress_by_stage: { FOUNDATION: 15 }, milestones: [] },
  psi: { unlocked_node_ids: [], values: { score: 50 }, flags: {} },
  resources: { money: 150000, time_slot: 'MORNING', schedule_progress: 15, safety_signal_count: 1, pressure_count: 0 },
  assignments: [],
  roster: [{ character_id: 'yoon_sungho', experience: 10, morale: 60, fatigue: 10, available: true, stats: {}, story_flags: {} }],
  scene: {
    scene_id: 'foundation.entry',
    event_id: 'e01_03_plan_breaks',
    background_asset_id: 'ep01.background.foundation.map',
    environment: 'foundation',
    primary_anchor: 'entry',
    active_layers: ['background', 'characters', 'signals'],
    hazard_signal_ids: ['signal.entry_congestion'],
  },
  signals: [{ signal_id: 'signal.entry_congestion', kind: 'access', anchor: 'entry', label_text_id: 'ui.signal.entry_congestion' }],
  placements: [{ character_id: 'yoon_sungho', anchor: 'entry', scene_participant: true, role_id: 'yoon', nearby_signal_ids: ['signal.entry_congestion'] }],
  frictions: [],
  runtime: {
    active_event_id: 'e01_03_plan_breaks',
    active_instance_id: 'run.e01_03_plan_breaks',
    participant_bindings: { yoon: 'yoon_sungho' },
    completed_event_count: 2,
    pending_followup_count: 0,
  },
} as unknown as StrategyView;

describe('Stage 3 representative visual lock', () => {
  it('limits the lock contract to arrival and first TBM immersive scenes', () => {
    expect(episode01Stage3VisualLock('e01_01_arrival')).toBe('stage3-entry');
    expect(episode01Stage3VisualLock('e01_02_meet_kang')).toBe('stage3-tbm');
    expect(episode01Stage3VisualLock('e01_04_junho_signal')).toBeUndefined();
  });

  it('marks the arrival world with the FIELD camera/depth production metadata', () => {
    const html = renderToStaticMarkup(<EpisodeImmersiveScene
      eventId="e01_01_arrival"
      nodeId="observe"
      presentationType="SHOW_DIALOGUE"
      eventTitle="현장 진입"
      resolve={resolve}
      t={t}
    />);

    expect(html).toContain('data-visual-lock="stage3-entry"');
    expect(html).toContain('data-field-camera="site-wide"');
    expect(html).toContain('data-field-depth="open-site"');
    expect(html).toContain('data-field-lighting="dawn-neutral"');
    expect(html).toContain('data-character="player"');
  });

  it('maps the first TBM speaker identity to the same foreground cast member and portrait', () => {
    const html = renderToStaticMarkup(<EpisodeImmersiveScene
      eventId="e01_02_meet_kang"
      nodeId="kang"
      speakerId="kang_taesik"
      speakerIdentity={{ name: '강태식', role: '형틀반장' }}
      presentationType="SHOW_DIALOGUE"
      eventTitle="첫 TBM"
      resolve={resolve}
      t={t}
    />);

    expect(html).toContain('data-visual-lock="stage3-tbm"');
    expect(html).toContain('data-tbm-camera="briefing-circle"');
    expect(html).toContain('data-speaker-id="kang_taesik"');
    expect(html).toContain('class="episode-immersive-speaker-portrait"');
    expect(html).toMatch(/data-speaker="true"[^>]*data-character="kang_taesik"/);
    expect(html).toMatch(/data-character="kang_taesik"[^>]*data-blocking-depth="foreground"/);
  });

  it('marks only the first strategy map as the grounded-map representative', () => {
    const html = renderToStaticMarkup(<StrategyMapShell
      view={strategyView}
      copy={copy}
      text={t}
      person={id => id === 'yoon_sungho' ? { name: '윤성호', role: '철근반장' } : undefined}
      actions={[]}
    />);

    expect(html).toContain('data-event="e01_03_plan_breaks"');
    expect(html).toContain('data-visual-lock="stage3-strategy"');
    expect(html).toContain('data-character="yoon_sungho"');
    expect(html).toContain('data-production-anchor="entry"');
  });

  it('locks feet-to-ground, TBM scale hierarchy and map-token grounding in the final CSS layer', () => {
    const css = fs.readFileSync('src/ui/stage3-visual-lock.css', 'utf8');

    expect(css).toContain('[data-visual-lock="stage3-entry"] .episode-immersive-character');
    expect(css).toContain('bottom: 3.7% !important');
    expect(css).toContain('[data-visual-lock="stage3-tbm"] .episode-immersive-character[data-blocking-depth="foreground"]');
    expect(css).toContain('object-position: 50% 100% !important');
    expect(css).toContain('.strategy-shell[data-visual-lock="stage3-strategy"] .strategy-map-worker');
    expect(css).toContain('transform: translate(-50%, -92%) !important');
    expect(css).toContain('.strategy-shell[data-visual-lock="stage3-strategy"] .strategy-worker-art');
    expect(css).toContain('bottom: 35% !important');
    expect(css).toContain('bottom: 23% !important');
    expect(css).toContain('.tbm-briefing-board');
    expect(css).toContain('article[data-resource="money"]');
    expect(css).toContain('.strategy-worker-label strong > em');
  });
});
