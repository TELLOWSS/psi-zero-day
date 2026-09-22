/** @vitest-environment jsdom */
import fs from 'node:fs';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { StrategyAction } from '../src/app/strategy-actions';
import type { StrategyView } from '../src/app/strategy-view';
import { StrategyMapShell } from '../src/ui/StrategyMapShell';

const copy = {
  brand: 'PSI : ZERO DAY', day: 'DAY', stage: 'STAGE', psi: 'PSI', objectives: 'OBJECTIVES',
  assignments: 'ASSIGNMENTS', roster: 'ROSTER', site: 'SITE', events: 'SIGNALS', progress: 'PROGRESS',
  pressures: 'FIELD PRESSURE', focus: 'FOCUS', focusHint: '대상을 선택하세요.',
  actions: '현장 행동', actionHint: '대상을 선택하세요.',
};

const labels: Readonly<Record<string, string>> = {
  'ui.signal.entry_congestion': '진입 통로 혼잡',
  'ui.signal.ramp_movement': '경사로 이상 신호',
  'ui.strategy.zones': '작업구역 선택',
  'ui.strategy.zone_hint': '이 작업구역에서 가능한 행동을 확인합니다.',
  'ui.strategy.zone.entry': '진입부',
  'ui.strategy.zone.ramp': '경사로',
  'ui.strategy.zone.yard': '자재 야적장',
  'ui.strategy.zone.gate': '현장 게이트',
  'ui.strategy.zone.inspection': '검측 구역',
  'ui.strategy.zone.overview': '현장 전체',
  'ui.strategy.zone.core': '코어',
  'ui.strategy.no_actions': '실행할 행동이 없습니다.',
  'ui.strategy.signal_guided': '이 위험 신호와 같은 위치의 실행 가능한 대응을 연결했습니다.',
  'ui.strategy.signal_info_only': '이 표시는 정보 신호입니다.',
  'ui.strategy.loop.label': '현장 판단 단계',
  'ui.strategy.loop.target': '1 대상 선택',
  'ui.strategy.loop.action': '2 조치 선택',
  'ui.strategy.loop.result': '3 결과 확인',
  'ui.strategy.result': '현장 결과',
  'ui.strategy.next_situation': '다음 상황 확인',
  'ui.strategy.actions': '현장 행동',
  'ui.strategy.action_hint': '대상을 선택하세요.',
  'ui.strategy.actor': '담당',
  'ui.strategy.target': '대상',
  'ui.strategy.execute': '조치 실행',
  'ui.strategy.executing': '조치 반영 중',
  'ui.strategy.cancel': '다시 선택',
  'ui.strategy.guide.kicker': '다음 행동',
  'ui.strategy.guide.target_title': '지도에서 대상을 선택하세요',
  'ui.strategy.guide.target_hint': '주황색으로 강조된 위험 신호·사람·작업 구역을 누르면 실행 가능한 조치가 열립니다.',
  'ui.strategy.guide.choose_title': '아래 조치 중 하나를 선택하세요',
  'ui.strategy.guide.choose_hint': '조치를 누르면 바로 실행되지 않습니다. 내용을 확인한 뒤 [조치 실행]을 누르세요.',
  'ui.strategy.guide.execute_title': '선택한 조치를 확인하세요',
  'ui.strategy.guide.execute_hint': '담당자와 대상을 확인한 뒤 아래 [조치 실행] 버튼을 눌러 현장에 반영하세요.',
  'ui.strategy.guide.available': '선택 가능한 조치',
  'ui.strategy.guide.confirm_title': '이 조치로 진행하시겠습니까?',
  'ui.strategy.situation': '현재 상황',
  'ui.strategy.guide.continue_title': '상황을 확인하고 조치 단계로 이어가세요',
  'ui.strategy.guide.continue_hint': '현재 상황 문장을 확인한 뒤 [조치 보기]를 누르면 같은 대상 선택을 유지한 채 실행 가능한 조치가 열립니다.',
  'ui.strategy.guide.continue_button': '조치 보기',
  'ui.resource.money': '돈',
  'ui.resource.time': '시간',
  'ui.resource.schedule': '공정',
  'ui.resource.safety': '안전',
  'ui.resource.safety_signals': '위험신호',
  'ui.resource.impact': '연결 자원',
  'ui.slot.morning': '오전',
  'ui.psi.related': 'PSI',
  'ui.paid_item.replan': '현장 재판단권',
  'ui.paid_item.owned': '보유',
  'ui.paid_item.use': '재판단권 사용',
  'ui.paid_item.unavailable': '보유권 없음',
  'ui.paid_item.replan_guard': '이미 발생·기록된 사고는 되돌릴 수 없습니다.',
  'ui.paid_item.confirm_title': '결과 확정 전 재판단',
  'ui.paid_item.confirm_replan': '직전 현장 판단으로 돌아갑니다.',
  'ui.paid_item.keep_result': '결과 유지',
  'ui.paid_item.confirm': '재판단',
  'ep01.plan.b': '철근 반장과 진입 순서를 조율한다.',
  'ep01.command.check_self': '경사로를 직접 확인한다.',
};

const text = (id: string) => labels[id] ?? id;
const people: Readonly<Record<string, { readonly name: string; readonly role: string }>> = {
  player: { name: '현장 안전관리자', role: '안전관리' },
  yoon_sungho: { name: '윤성호', role: '철근반장' },
  lim_junho: { name: '임준호', role: '신입근로자' },
};
const person = (id: string) => people[id];

const baseView: StrategyView = {
  clock: { day: 1, slot: 'MORNING' },
  construction: { stage_id: 'FOUNDATION', current_stage_progress: 15, progress_by_stage: { FOUNDATION: 15 }, milestones: [] },
  psi: { unlocked_node_ids: [], values: { score: 50 }, flags: {} },
  resources: { money: 150000, time_slot: 'MORNING', schedule_progress: 15, safety_signal_count: 1, pressure_count: 0 },
  assignments: [],
  roster: [
    { character_id: 'yoon_sungho', experience: 10, morale: 60, fatigue: 10, available: true, stats: {}, story_flags: {} },
    { character_id: 'lim_junho', experience: 3, morale: 60, fatigue: 10, available: true, stats: {}, story_flags: {} },
  ],
  scene: {
    scene_id: 'foundation.entry', event_id: 'e01_03_plan_breaks',
    background_asset_id: 'ep01.background.foundation.map', environment: 'foundation', primary_anchor: 'entry',
    active_layers: ['background', 'characters', 'signals'], hazard_signal_ids: ['signal.entry_congestion'],
  },
  signals: [{ signal_id: 'signal.entry_congestion', kind: 'access', anchor: 'entry', label_text_id: 'ui.signal.entry_congestion' }],
  placements: [
    { character_id: 'yoon_sungho', anchor: 'entry', scene_participant: true, role_id: 'yoon', nearby_signal_ids: ['signal.entry_congestion'] },
    { character_id: 'lim_junho', anchor: 'ramp', scene_participant: false, nearby_signal_ids: [] },
  ],
  frictions: [],
  runtime: { active_event_id: 'e01_03_plan_breaks', active_instance_id: 'run.e01_03_plan_breaks', participant_bindings: { yoon: 'yoon_sungho' }, completed_event_count: 2, pending_followup_count: 0 },
};

const entryActions: readonly StrategyAction[] = [
  {
    event_id: 'e01_03_plan_breaks', instance_id: 'run.e01_03_plan_breaks', node_id: 'plan',
    choice_id: 'negotiate_yoon', label_text_id: 'ep01.plan.b', enabled: true, intent: 'coordinate',
    target: { kind: 'character', character_id: 'yoon_sungho' }, actor_character_id: 'yoon_sungho', resource_axes: ['time', 'schedule'],
  },
  {
    event_id: 'e01_03_plan_breaks', instance_id: 'run.e01_03_plan_breaks', node_id: 'plan',
    choice_id: 'coordinate_schedule', label_text_id: 'ep01.plan.c', enabled: true, intent: 'coordinate',
    target: { kind: 'site' }, actor_character_id: 'player', resource_axes: ['time', 'schedule'],
  },
];

const rampAction: StrategyAction = {
  event_id: 'e01_05_command', instance_id: 'run.e01_05_command', node_id: 'ramp',
  choice_id: 'check_self', label_text_id: 'ep01.command.check_self', enabled: true, intent: 'inspect',
  target: { kind: 'anchor', anchor: 'ramp' }, actor_character_id: 'player', resource_axes: ['time', 'safety'],
};

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function mount(view: StrategyView, actions: readonly StrategyAction[], onAction = vi.fn()) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(<StrategyMapShell view={view} copy={copy} text={text} person={person} actions={actions} onAction={onAction} />);
  });
  return { host, root, onAction };
}

describe('Strategy stage 2 interaction flow', () => {
  it('keeps the command tray visible while the engine is still on a non-choice strategy node', async () => {
    const onTransitionContinue = vi.fn();
    const { host, root } = await mount(baseView, []);
    await act(async () => {
      root.render(<StrategyMapShell
        view={baseView}
        copy={copy}
        text={text}
        person={person}
        actions={[]}
        eventTitle="계획이 어긋나다"
        transitionPrompt="펌프카 진입 전 동선을 다시 확인한다."
        onTransitionContinue={onTransitionContinue}
      />);
    });
    await flush();

    const tray = host.querySelector('.strategy-action-tray');
    expect(tray).not.toBeNull();
    expect(tray?.getAttribute('data-guide-state')).toBe('continue');
    expect(host.textContent).toContain('상황을 확인하고 조치 단계로 이어가세요');
    expect(host.textContent).toContain('펌프카 진입 전 동선을 다시 확인한다.');

    const signal = host.querySelector('[data-signal="signal.entry_congestion"]') as HTMLButtonElement;
    await act(async () => { signal.click(); });
    await flush();
    expect(host.querySelector('.strategy-action-tray')).not.toBeNull();
    expect(host.querySelector('[data-loop-phase="action"]')).not.toBeNull();

    const continueButton = host.querySelector('.strategy-transition-button') as HTMLButtonElement;
    expect(continueButton).toBeInstanceOf(HTMLButtonElement);
    await act(async () => { continueButton.click(); });
    expect(onTransitionContinue).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.render(<StrategyMapShell
        view={baseView}
        copy={copy}
        text={text}
        person={person}
        actions={entryActions}
        eventTitle="계획이 어긋나다"
      />);
    });
    await flush();

    expect(host.querySelector('[data-choice="negotiate_yoon"]')).not.toBeNull();
    expect(host.textContent).toContain('아래 조치 중 하나를 선택하세요');

    await act(async () => root.unmount());
    host.remove();
  });

  it('loads the final strategy recovery layer after Phase D and separates the top rows', () => {
    const main = fs.readFileSync('src/app/main.tsx', 'utf8');
    const css = fs.readFileSync('src/ui/strategy-layout-recovery.css', 'utf8');

    expect(main.indexOf("phase-d-screenshot-polish.css")).toBeGreaterThan(-1);
    expect(main.indexOf("strategy-layout-recovery.css")).toBeGreaterThan(main.indexOf("phase-d-screenshot-polish.css"));
    expect(css).toContain('.strategy-event-title');
    expect(css).toContain('top: 8.2% !important');
    expect(css).toContain('.strategy-loop-stage-strip');
    expect(css).toContain('top: 13.1% !important');
    expect(css).toContain('.strategy-map {');
    expect(css).toContain('inset: 17.2% 1% 1.4% 14% !important');
    expect(css).toContain('.strategy-overview-minimap');
    expect(css).toContain('display: block !important');
    expect(css).toContain('z-index: 90 !important');
  });

  it('starts directly at target selection without the extra observe gate', () => {
    const html = renderToStaticMarkup(<StrategyMapShell view={baseView} copy={copy} text={text} person={person} actions={entryActions} />);
    expect(html).toContain('data-loop-phase="target"');
    expect(html).toContain('1 대상 선택');
    expect(html).not.toContain('strategy-observe-card');
    expect(html).not.toContain('대상 선택 시작');
  });

  it('connects an informational entry signal only to same-anchor authored actions', async () => {
    const { host, root } = await mount(baseView, entryActions);
    const signal = host.querySelector('[data-signal="signal.entry_congestion"]');
    expect(signal).toBeInstanceOf(HTMLButtonElement);
    expect(signal?.getAttribute('data-action-count')).toBe('1');

    await act(async () => { (signal as HTMLButtonElement).click(); });
    await flush();

    expect(host.querySelector('[data-choice="negotiate_yoon"]')).not.toBeNull();
    expect(host.querySelector('[data-choice="coordinate_schedule"]')).toBeNull();
    expect(host.textContent).toContain('같은 위치의 실행 가능한 대응');
    expect(host.querySelector('[data-guide-state="choose"]')).not.toBeNull();
    expect(host.textContent).toContain('아래 조치 중 하나를 선택하세요');
    expect(host.textContent).toContain('조치 실행');

    await act(async () => root.unmount());
    host.remove();
  });

  it('routes an overlapped ramp worker click to the actionable ramp zone and completes in three meaningful clicks', async () => {
    const rampView: StrategyView = {
      ...baseView,
      scene: { ...baseView.scene, event_id: 'e01_05_command', primary_anchor: 'ramp', hazard_signal_ids: ['signal.ramp_movement'] },
      signals: [{ signal_id: 'signal.ramp_movement', kind: 'ramp', anchor: 'ramp', label_text_id: 'ui.signal.ramp_movement' }],
      placements: [{ character_id: 'lim_junho', anchor: 'ramp', scene_participant: true, role_id: 'junho', nearby_signal_ids: ['signal.ramp_movement'] }],
      runtime: { ...baseView.runtime, active_event_id: 'e01_05_command', active_instance_id: 'run.e01_05_command', participant_bindings: { junho: 'lim_junho' } },
    };
    const onAction = vi.fn();
    const { host, root } = await mount(rampView, [rampAction], onAction);

    const worker = host.querySelector('[data-character="lim_junho"]') as HTMLButtonElement;
    expect(worker).toBeInstanceOf(HTMLButtonElement);
    await act(async () => { worker.click(); });
    await flush();

    const action = host.querySelector('[data-choice="check_self"]') as HTMLButtonElement;
    expect(action).toBeInstanceOf(HTMLButtonElement);
    expect(action.getAttribute('data-action-target')).toBe('anchor:ramp');

    await act(async () => { action.click(); });
    await flush();

    const execute = host.querySelector('.strategy-action-confirm .strategy-execute-button') as HTMLButtonElement;
    expect(execute).toBeInstanceOf(HTMLButtonElement);
    await act(async () => {
      execute.click();
      execute.click();
    });
    await flush();

    expect(onAction).toHaveBeenCalledTimes(1);

    await act(async () => root.unmount());
    host.remove();
  });

  it('keeps cancel available and names the post-result button by what it actually does', async () => {
    const { host, root } = await mount(baseView, entryActions);
    await act(async () => { (host.querySelector('[data-character="yoon_sungho"]') as HTMLButtonElement).click(); });
    await flush();
    await act(async () => { (host.querySelector('[data-choice="negotiate_yoon"]') as HTMLButtonElement).click(); });
    await flush();

    expect(host.querySelector('[data-pending-choice="negotiate_yoon"]')).not.toBeNull();
    expect(host.querySelector('[data-guide-state="execute"]')).not.toBeNull();
    expect(host.textContent).toContain('선택한 조치를 확인하세요');
    expect(host.textContent).toContain('이 조치로 진행하시겠습니까?');
    await act(async () => { (host.querySelector('.strategy-cancel-button') as HTMLButtonElement).click(); });
    await flush();
    expect(host.querySelector('[data-pending-choice="negotiate_yoon"]')).toBeNull();

    await act(async () => root.render(<StrategyMapShell
      view={baseView} copy={copy} text={text} person={person} actions={[]}
      outcome={{ key: 'result.1', text: '현장 조치 결과', reconsideration: { item_id: 'action.replan_pass', remaining: 0, enabled: false } }}
    />));
    await flush();

    const next = host.querySelector('.strategy-outcome-next') as HTMLButtonElement;
    expect(next).toBeInstanceOf(HTMLButtonElement);
    expect(next.textContent).toContain('다음 상황 확인');
    expect(host.textContent).not.toContain('맵으로 복귀');
    expect(host.querySelector('details.strategy-replan-card')).not.toBeNull();

    await act(async () => root.unmount());
    host.remove();
  });
});
