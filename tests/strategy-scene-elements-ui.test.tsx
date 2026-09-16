import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { StrategyView } from '../src/app/strategy-view';
import { StrategyMapShell } from '../src/ui/StrategyMapShell';

const view: StrategyView = {
  clock: { day: 1, slot: 'MORNING' },
  construction: { stage_id: 'FOUNDATION', current_stage_progress: 12, progress_by_stage: { FOUNDATION: 12 }, milestones: [] },
  psi: { unlocked_node_ids: [], values: {}, flags: {} },
  resources: { money: 0, time_slot: 'MORNING', schedule_progress: 12, safety_signal_count: 1, pressure_count: 0 },
  assignments: [],
  roster: [],
  scene: {
    scene_id: 'foundation.access-conflict',
    event_id: 'e01_03_plan_breaks',
    background_asset_id: 'ep01.background.foundation.map',
    environment: 'foundation',
    primary_anchor: 'entry',
    active_layers: ['background', 'characters', 'elements', 'signals', 'pressures', 'dialogue'],
    hazard_signal_ids: ['signal.entry_congestion'],
    elements: [{
      element_id: 'scene.prop.material_stack',
      catalog_key: 'material_stack',
      kind: 'prop',
      label: '통로 인접 적재 자재',
      visual_token: '▤',
      anchor: 'entry',
      production_status: 'css-placeholder',
      planned_asset_id: 'ep01.scene_element.material_stack',
    }],
  },
  signals: [{ signal_id: 'signal.entry_congestion', kind: 'access', anchor: 'entry', label_text_id: 'ui.signal.entry_congestion' }],
  placements: [],
  frictions: [],
  runtime: { active_event_id: 'e01_03_plan_breaks', active_instance_id: 'run.e01_03_plan_breaks', participant_bindings: {}, completed_event_count: 0, pending_followup_count: 0 },
};

const copy = {
  brand: 'PSI : ZERO DAY', day: 'DAY', stage: 'STAGE', psi: 'PSI', objectives: 'OBJECTIVES',
  assignments: 'ASSIGNMENTS', roster: 'ROSTER', site: 'SITE', events: 'SIGNALS', progress: 'PROGRESS',
  pressures: 'FIELD PRESSURE', focus: 'FOCUS', focusHint: 'Select a worker or signal.',
  actions: 'FIELD ACTIONS', actionHint: 'Select a map target first.',
};
const text = (id: string) => id;

describe('Reusable scene element map layer', () => {
  it('renders physical props separately from actionable risk signals', () => {
    const html = renderToStaticMarkup(<StrategyMapShell view={view} copy={copy} text={text} person={() => undefined} />);

    expect(html).toContain('data-scene="foundation.access-conflict"');
    expect(html).toContain('data-environment="foundation"');
    expect(html).toContain('strategy-scene-element-layer');
    expect(html).toContain('data-scene-element="scene.prop.material_stack"');
    expect(html).toContain('data-scene-element-key="material_stack"');
    expect(html).toContain('통로 인접 적재 자재');
    expect(html).toContain('data-signal="signal.entry_congestion"');
  });
});
