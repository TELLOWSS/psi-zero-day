import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { StrategyAction } from '../src/app/strategy-actions';
import type { StrategyView } from '../src/app/strategy-view';
import { StrategyMapShell } from '../src/ui/StrategyMapShell';

const view: StrategyView = {
  clock: { day: 3, slot: 'MORNING' },
  construction: { stage_id: 'TYPICAL_FLOOR', current_stage_progress: 42, progress_by_stage: { TYPICAL_FLOOR: 42 }, milestones: [] },
  psi: { unlocked_node_ids: [], values: { score: 78 }, flags: {} },
  assignments: [{ assignment_id: 'a1', character_id: 'lim_junho', task_id: 'task.1' }],
  roster: [{ character_id: 'lim_junho', experience: 12, morale: 60, fatigue: 15, available: true, stats: {}, story_flags: {} }],
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
};
const text = (id: string) => labels[id] ?? id;
const person = (id: string) => id === 'lim_junho' ? { name: '임준호', role: '신입근로자' } : undefined;
const actions: readonly StrategyAction[] = [{
  event_id: 'e01_04_junho_signal', instance_id: 'run.e01_04_junho_signal', node_id: 'listen',
  choice_id: 'listen_more', label_text_id: 'ep01.junho.listen_more', enabled: true, intent: 'inspect',
  target: { kind: 'character', character_id: 'lim_junho' },
}];

describe('StrategyMapShell', () => {
  it('marks actionable people/signals/zones and waits for a target selection before listing actions', () => {
    const html = renderToStaticMarkup(<StrategyMapShell view={view} copy={copy} text={text} person={person} actions={actions} />);
    expect(html).toContain('data-stage="TYPICAL_FLOOR"');
    expect(html).toContain('PSI : ZERO DAY');
    expect(html).toContain('data-character="lim_junho"');
    expect(html).toContain('data-action-count="1"');
    expect(html).toContain('has-actions');
    expect(html).toContain('임준호');
    expect(html).toContain('data-signal="signal.ramp_movement"');
    expect(html).toContain('경사로 이상 신호');
    expect(html).toContain('data-zone="ramp"');
    expect(html).toContain('자재 야적장');
    expect(html).toContain('FIELD ACTIONS');
    expect(html).toContain('Select a map target first.');
    expect(html).not.toContain('data-choice="listen_more"');
  });
});
