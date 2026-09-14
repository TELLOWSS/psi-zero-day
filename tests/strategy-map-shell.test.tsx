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
  runtime: { active_event_id: 'event.1', active_instance_id: 'run.event.1', completed_event_count: 1, pending_followup_count: 0 },
};

const copy = {
  brand: 'PSI : ZERO DAY', day: 'DAY', stage: 'STAGE', psi: 'PSI', objectives: 'OBJECTIVES',
  assignments: 'ASSIGNMENTS', roster: 'ROSTER', site: 'SITE', events: 'EVENTS', progress: 'PROGRESS',
};

describe('StrategyMapShell', () => {
  it('renders a strategy-first site shell from StrategyView only', () => {
    const html = renderToStaticMarkup(<StrategyMapShell view={view} copy={copy} />);
    expect(html).toContain('data-stage="TYPICAL_FLOOR"');
    expect(html).toContain('PSI : ZERO DAY');
    expect(html).toContain('event.1');
    expect(html).toContain('worker.1');
    expect(html).toContain('42');
  });
});
