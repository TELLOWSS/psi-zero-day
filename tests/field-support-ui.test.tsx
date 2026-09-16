import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { StrategyView } from '../src/app/strategy-view';
import { StrategyMapShell } from '../src/ui/StrategyMapShell';

const view: StrategyView = {
  clock: { day: 1, slot: 'MORNING' },
  construction: { stage_id: 'FOUNDATION', current_stage_progress: 10, progress_by_stage: { FOUNDATION: 10 }, milestones: [] },
  psi: { unlocked_node_ids: [], values: {}, flags: {} },
  resources: { money: 0, time_slot: 'MORNING', schedule_progress: 10, safety_signal_count: 0, pressure_count: 0 },
  assignments: [], roster: [],
  scene: {
    scene_id: 'foundation.access-conflict', event_id: 'e01_03_plan_breaks',
    background_asset_id: 'ep01.background.foundation.map', environment: 'foundation', primary_anchor: 'entry',
    active_layers: ['background', 'characters', 'signals', 'pressures', 'dialogue'], hazard_signal_ids: [],
  },
  signals: [], placements: [], frictions: [],
  runtime: { active_event_id: 'e01_03_plan_breaks', active_instance_id: 'run.e01_03_plan_breaks', participant_bindings: {}, completed_event_count: 1, pending_followup_count: 0 },
};

const copy = {
  brand: 'PSI : ZERO DAY', day: 'DAY', stage: 'STAGE', psi: 'PSI', objectives: 'OBJECTIVES',
  assignments: 'ASSIGNMENTS', roster: 'ROSTER', site: 'SITE', events: 'SIGNALS', progress: 'PROGRESS',
  pressures: 'FIELD PRESSURE', focus: 'FOCUS', focusHint: 'Select a worker or signal.',
  actions: 'FIELD ACTIONS', actionHint: 'Select a map target first.',
};

const messages: Record<string, string> = {
  'ui.resource.money': '돈', 'ui.resource.time': '시간', 'ui.resource.schedule': '공정', 'ui.resource.safety': '안전',
  'ui.resource.safety_signals': '위험신호', 'ui.slot.morning': '오전',
  'ui.paid_item.support_title': '현장 지원', 'ui.paid_item.facility': '시설', 'ui.paid_item.equipment': '용품',
  'ui.paid_item.deploy': '배치', 'ui.paid_item.commit': '투입', 'ui.paid_item.active': '적용 중', 'ui.paid_item.owned': '보유',
  'ui.paid_item.facility.access_lane': '임시 안전통로', 'ui.paid_item.equipment.inspection_kit': '현장 검측 키트',
};
const text = (id: string) => messages[id] ?? id;

describe('TASK-015B3 field support UI', () => {
  it('shows only supplied owned/active support items and disables repeat deployment by rendering active state', () => {
    const html = renderToStaticMarkup(<StrategyMapShell
      view={view}
      copy={copy}
      text={text}
      person={() => undefined}
      supportItems={[
        { item_id: 'facility.access_lane', category: 'facility', name_text_id: 'ui.paid_item.facility.access_lane', remaining: 0, active: true, enabled: false },
        { item_id: 'equipment.inspection_kit', category: 'equipment', name_text_id: 'ui.paid_item.equipment.inspection_kit', remaining: 2, active: false, enabled: true },
      ]}
    />);
    expect(html).toContain('현장 지원');
    expect(html).toContain('data-support-item="facility.access_lane"');
    expect(html).toContain('data-support-active="true"');
    expect(html).toContain('임시 안전통로');
    expect(html).toContain('적용 중');
    expect(html).toContain('data-support-item="equipment.inspection_kit"');
    expect(html).toContain('현장 검측 키트');
    expect(html).toContain('투입 · 보유 2');
  });

  it('does not add an empty support panel when no owned or active support item is supplied', () => {
    const html = renderToStaticMarkup(<StrategyMapShell view={view} copy={copy} text={text} person={() => undefined} />);
    expect(html).not.toContain('strategy-support-panel');
  });
});
