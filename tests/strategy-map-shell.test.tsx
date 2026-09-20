import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { StrategyAction } from '../src/app/strategy-actions';
import type { StrategyVisualAssets } from '../src/app/strategy-assets';
import type { StrategyView } from '../src/app/strategy-view';
import { StrategyMapShell } from '../src/ui/StrategyMapShell';

const view: StrategyView = {
  clock: { day: 3, slot: 'MORNING' },
  construction: { stage_id: 'TYPICAL_FLOOR', current_stage_progress: 42, progress_by_stage: { TYPICAL_FLOOR: 42 }, milestones: [] },
  psi: { unlocked_node_ids: [], values: { score: 78 }, flags: {} },
  resources: { money: 150000, time_slot: 'MORNING', schedule_progress: 42, safety_signal_count: 1, pressure_count: 1 },
  assignments: [{ assignment_id: 'a1', character_id: 'lim_junho', task_id: 'task.1' }],
  roster: [{ character_id: 'lim_junho', experience: 12, morale: 60, fatigue: 15, available: true, stats: {}, story_flags: {} }],
  scene: {
    scene_id: 'foundation.ramp-signal', event_id: 'e01_04_junho_signal',
    background_asset_id: 'ep01.background.foundation.map', environment: 'foundation', primary_anchor: 'ramp',
    active_layers: ['background', 'characters', 'signals', 'pressures', 'dialogue'],
    hazard_signal_ids: ['signal.ramp_movement'],
  },
  signals: [{ signal_id: 'signal.ramp_movement', kind: 'ramp', anchor: 'ramp', label_text_id: 'ui.signal.ramp_movement' }],
  placements: [{ character_id: 'lim_junho', anchor: 'ramp', scene_participant: true, role_id: 'junho', nearby_signal_ids: ['signal.ramp_movement'] }],
  frictions: [{ friction_id: 'friction.reporting.hesitation', kind: 'reporting_hesitation', label_text_id: 'ui.friction.reporting', detail_text_id: 'ui.friction.reporting.hesitation' }],
  runtime: { active_event_id: 'e01_04_junho_signal', active_instance_id: 'run.e01_04_junho_signal', participant_bindings: { junho: 'lim_junho' }, completed_event_count: 1, pending_followup_count: 0 },
};

const copy = {
  brand: 'PSI : ZERO DAY', day: 'DAY', stage: 'STAGE', psi: 'PSI', objectives: 'OBJECTIVES',
  assignments: 'ASSIGNMENTS', roster: 'ROSTER', site: 'SITE', events: 'SIGNALS', progress: 'PROGRESS',
  pressures: 'FIELD PRESSURE', focus: 'FOCUS', focusHint: 'Select a worker or signal.',
  actions: 'FIELD ACTIONS', actionHint: 'Select a map target first.',
};
const labels: Readonly<Record<string, string>> = {
  'ui.signal.ramp_movement': '경사로 이상 신호',
  'ui.friction.reporting': '보고 위축',
  'ui.friction.reporting.hesitation': '이상 신호를 본 사람이 말을 꺼냈다가 멈춘다.',
  'ui.strategy.zones': '작업구역 선택',
  'ui.strategy.zone_hint': '이 작업구역에서 가능한 행동을 확인합니다.',
  'ui.strategy.zone.entry': '진입부',
  'ui.strategy.zone.ramp': '경사로',
  'ui.strategy.zone.yard': '자재 야적장',
  'ui.strategy.zone.gate': '현장 게이트',
  'ui.strategy.no_actions': '현재 선택한 대상에는 실행할 행동이 없습니다.',
  'ui.strategy.loop.target': '1 대상 선택',
  'ui.strategy.loop.action': '2 조치 선택',
  'ui.strategy.loop.result': '3 결과 확인',
  'ui.strategy.result': '현장 결과',
  'ui.strategy.return_map': '맵으로 복귀',
  'ui.strategy.actions': '현장 행동',
  'ui.strategy.action_hint': '먼저 대상을 선택하세요.',
  'ui.strategy.actor': '담당',
  'ui.strategy.target': '대상',
  'ui.strategy.execute': '조치 실행',
  'ui.strategy.cancel': '다시 선택',
  'ui.resource.money': '돈',
  'ui.resource.time': '시간',
  'ui.resource.schedule': '공정',
  'ui.resource.safety': '안전',
  'ui.resource.safety_signals': '위험신호',
  'ui.resource.impact': '연결 자원',
  'ui.slot.morning': '오전',
  'ui.paid_item.replan': '현장 재판단권',
  'ui.paid_item.owned': '보유',
  'ui.paid_item.use': '재판단권 사용',
  'ui.paid_item.unavailable': '보유권 없음',
  'ui.paid_item.replan_guard': '이미 발생·기록된 사고는 되돌릴 수 없습니다.',
  'ui.paid_item.confirm_title': '결과 확정 전 재판단',
  'ui.paid_item.confirm_replan': '직전 현장 판단으로 돌아갑니다.',
  'ui.paid_item.keep_result': '결과 유지',
  'ui.paid_item.confirm': '재판단',
};
const text = (id: string) => labels[id] ?? id;
const person = (id: string) => id === 'lim_junho' ? { name: '임준호', role: '신입근로자' } : id === 'player' ? { name: '현장 안전관리자', role: '안전관리' } : undefined;
const actions: readonly StrategyAction[] = [{
  event_id: 'e01_04_junho_signal', instance_id: 'run.e01_04_junho_signal', node_id: 'listen',
  choice_id: 'listen_more', label_text_id: 'ep01.junho.listen_more', enabled: true, intent: 'inspect',
  target: { kind: 'character', character_id: 'lim_junho' }, actor_character_id: 'player', resource_axes: ['time', 'safety'],
}];
const visualAssets: StrategyVisualAssets = {
  background_uri: 'assets/episode01/backgrounds/foundation-map.webp',
  characters: {
    lim_junho: {
      character_id: 'lim_junho',
      map_uri: 'assets/episode01/characters/lim-junho-map.webp',
      portrait_uri: 'assets/episode01/characters/lim-junho-portrait.webp',
      accent: '#59a477',
    },
  },
};

describe('StrategyMapShell', () => {
  it('marks actionable people/signals/zones and starts the loop at target selection', () => {
    const html = renderToStaticMarkup(<StrategyMapShell view={view} copy={copy} text={text} person={person} actions={actions} />);
    expect(html).toContain('data-stage="TYPICAL_FLOOR"');
    expect(html).toContain('data-loop-phase="target"');
    expect(html).toContain('data-visual-mode="css"');
    expect(html).toContain('data-character="lim_junho"');
    expect(html).toContain('data-art-surface="map"');
    expect(html).toContain('data-action-count="1"');
    expect(html).toContain('has-actions');
    expect(html).toContain('임준호');
    expect(html).toContain('신입근로자');
    expect(html).toContain('data-signal="signal.ramp_movement"');
    expect(html).toContain('경사로 이상 신호');
    expect(html).toContain('data-zone="ramp"');
    expect(html).toContain('data-production-map="v1"');
    expect(html).toContain('data-production-anchor="ramp"');
    expect(html).toContain('left:49%');
    expect(html).toContain('top:34.5%');
    expect(html).toContain('1 대상 선택');
    expect(html).toContain('먼저 대상을 선택하세요.');
    expect(html).not.toContain('data-choice="listen_more"');
  });

  it('renders factual money/time/schedule/safety resources without a synthetic PSI score meter', () => {
    const html = renderToStaticMarkup(<StrategyMapShell view={view} copy={copy} text={text} person={person} actions={actions} />);
    expect(html).toContain('strategy-resource-bar');
    expect(html).toContain('₩150,000');
    expect(html).toContain('오전');
    expect(html).toContain('42%');
    expect(html).toContain('위험신호 1');
    expect(html).not.toContain('strategy-meter-track');
    expect(html).not.toContain('width:78%');
  });

  it('renders field results on the map as the third loop step', () => {
    const html = renderToStaticMarkup(<StrategyMapShell
      view={view} copy={copy} text={text} person={person} actions={[]}
      outcome={{ key: 'result.1', text: '임준호의 위험신호를 확인했다.', relationship_lines: ['임준호 · 보고 +4'] }}
    />);
    expect(html).toContain('data-loop-phase="result"');
    expect(html).toContain('data-outcome="result.1"');
    expect(html).toContain('3 결과 확인');
    expect(html).toContain('임준호의 위험신호를 확인했다.');
    expect(html).toContain('임준호 · 보고 +4');
    expect(html).toContain('맵으로 복귀');
  });

  it('shows the replan pass lifecycle on an unresolved field result without erasing incident language', () => {
    const html = renderToStaticMarkup(<StrategyMapShell
      view={view} copy={copy} text={text} person={person} actions={[]}
      outcome={{
        key: 'result.replan', text: '현장 조치 결과',
        reconsideration: { item_id: 'action.replan_pass', remaining: 1, enabled: true },
      }}
    />);
    expect(html).toContain('data-paid-item="action.replan_pass"');
    expect(html).toContain('현장 재판단권');
    expect(html).toContain('보유 1');
    expect(html).toContain('재판단권 사용');
    expect(html).toContain('이미 발생·기록된 사고는 되돌릴 수 없습니다.');
  });

  it('switches to production-art mode when registered assets resolve', () => {
    const html = renderToStaticMarkup(<StrategyMapShell
      view={view} copy={copy} text={text} person={person} actions={actions} visualAssets={visualAssets}
    />);
    expect(html).toContain('data-visual-mode="art"');
    expect(html).toContain('strategy-map-background-art');
    expect(html).toContain('foundation-map.webp');
    expect(html).toContain('data-visual="asset"');
    expect(html).toContain('strategy-worker-art');
    expect(html).toContain('lim-junho-map.webp');
    expect(html).toContain('lim-junho-portrait.webp');
  });

  it('renders the Phase C-4 production map layer above the world backdrop and below interactive anchors', () => {
    const html = renderToStaticMarkup(<StrategyMapShell view={view} copy={copy} text={text} person={person} actions={actions} />);
    expect(html).toContain('class="strategy-production-layer"');
    expect(html).toContain('class="strategy-production-grid"');
    expect(html).toContain('class="strategy-production-route"');
    expect(html).toContain('class="strategy-production-pulse"');
  });

});
