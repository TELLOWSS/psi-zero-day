import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
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
  runtime: { active_event_id: 'e01_04_junho_signal', active_instance_id: 'run.e01_04_junho_signal', participant_bindings: { junho: 'lim_junho' }, completed_event_count: 1, pending_followup_count: 0 },
};

const copy = {
  brand: 'PSI : ZERO DAY', day: 'DAY', stage: 'STAGE', psi: 'PSI', objectives: 'OBJECTIVES',
  assignments: 'ASSIGNMENTS', roster: 'ROSTER', site: 'SITE', events: 'SIGNALS', progress: 'PROGRESS',
};
const text = (id: string) => id === 'ui.signal.ramp_movement' ? '경사로 이상 신호' : id;
const person = (id: string) => id === 'lim_junho' ? { name: '임준호', role: '신입근로자' } : undefined;

describe('StrategyMapShell', () => {
  it('renders localized site characters beside approved signal markers', () => {
    const html = renderToStaticMarkup(<StrategyMapShell view={view} copy={copy} text={text} person={person} />);
    expect(html).toContain('data-stage="TYPICAL_FLOOR"');
    expect(html).toContain('PSI : ZERO DAY');
    expect(html).toContain('data-character="lim_junho"');
    expect(html).toContain('data-scene-participant="true"');
    expect(html).toContain('임준호');
    expect(html).toContain('신입근로자');
    expect(html).toContain('data-signal="signal.ramp_movement"');
    expect(html).toContain('경사로 이상 신호');
  });
});
