import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { StrategyView } from '../src/app/strategy-view';
import { StrategyMapShell } from '../src/ui/StrategyMapShell';

const view: StrategyView = {
  clock: { day: 3, slot: 'MORNING' },
  construction: { stage_id: 'TYPICAL_FLOOR', current_stage_progress: 42, progress_by_stage: { TYPICAL_FLOOR: 42 }, milestones: [] },
  psi: { unlocked_node_ids: [], values: { score: 78 }, flags: {} },
  assignments: [{ assignment_id: 'a1', character_id: 'worker.1', task_id: 'task.1' }],
  roster: [{ character_id: 'worker.1', experience: 2, morale: 70, fatigue: 20, available: true, stats: {}, story_flags: {} }],
  signals: [{ signal_id: 'signal.ramp_movement', kind: 'ramp', anchor: 'ramp', label_text_id: 'ui.signal.ramp_movement' }],
  runtime: { active_event_id: 'event.1', active_instance_id: 'run.event.1', completed_event_count: 1, pending_followup_count: 0 },
};

const copy = {
  brand: 'PSI : ZERO DAY', day: 'DAY', stage: 'STAGE', psi: 'PSI', objectives: 'OBJECTIVES',
  assignments: 'ASSIGNMENTS', roster: 'ROSTER', site: 'SITE', events: 'SIGNALS', progress: 'PROGRESS',
};
const text = (id: string) => id === 'ui.signal.ramp_movement' ? '경사로 이상 신호' : id;

describe('StrategyMapShell', () => {
  it('renders strategy state and localized signal markers', () => {
    const html = renderToStaticMarkup(<StrategyMapShell view={view} copy={copy} text={text} />);
    expect(html).toContain('data-stage="TYPICAL_FLOOR"');
    expect(html).toContain('PSI : ZERO DAY');
    expect(html).toContain('worker.1');
    expect(html).toContain('42');
    expect(html).toContain('data-signal="signal.ramp_movement"');
    expect(html).toContain('경사로 이상 신호');
  });
});
