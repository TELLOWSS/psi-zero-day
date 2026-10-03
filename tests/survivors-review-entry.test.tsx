// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { PatrolSurvivorsGame } from '../src/ui/PatrolSurvivorsGame';
import { PATROL_STAGES, SurvivorsEngine } from '../src/engine/patrol-survivors-engine';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

it('shows mission conditions before start, opens the shooting manual while paused and briefs the next unlocked stage', () => {
  let frame: FrameRequestCallback = () => {};
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frame = callback; return 1; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  const gradient = { addColorStop: vi.fn() };
  const context = new Proxy({}, { get: (_, key) => key === 'createLinearGradient' || key === 'createRadialGradient' ? () => gradient : key === 'measureText' ? () => ({ width: 10 }) : vi.fn(), set: () => true });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as CanvasRenderingContext2D);
  let engine: SurvivorsEngine;
  const original = SurvivorsEngine.prototype.start;
  vi.spyOn(SurvivorsEngine.prototype, 'start').mockImplementation(function (this: SurvivorsEngine) { engine = this; original.call(this); });
  const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
  const click = (text: string) => act(() => [...host.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === text)!.click());
  try {
    act(() => root.render(<PatrolSurvivorsGame onExit={() => {}} audioMuted />));
    const launch = host.querySelector('.survivors-ready-launch')!;
    expect(launch.textContent).toContain('순찰 시작하기');
    for (const goal of PATROL_STAGES.stage_01.starChallenges) expect(host.querySelector('.survivors-mission-brief')?.textContent).toContain(goal.description);
    expect(host.querySelectorAll('details.survivors-ready-details[open]')).toHaveLength(0);
    click('순찰 시작하기');
    vi.spyOn(engine!, 'update').mockImplementationOnce(() => { engine!.state.ultimateCharge = 99.6; });
    act(() => frame(performance.now() + 100));
    const shout = host.querySelector<HTMLButtonElement>('[aria-label="현장소장 사자후 궁극기 발동"]')!;
    expect(shout.disabled).toBe(true);
    expect(shout.textContent).toContain('99%');
    click('일시정지 (P)');
    click('게임 설명서');
    const expanded = host.querySelector('.game-manual details[open]');
    expect(expanded?.textContent).toContain('슈팅');
    expect(engine!.state.phase).toBe('paused');
    click('설명서 닫기');
    expect(engine!.state.phase).toBe('paused');
    click('순찰 재개');
    vi.mocked(engine!.update).mockImplementationOnce(() => { engine!.state.phase = 'victory'; });
    act(() => frame(performance.now() + 20));
    click('다음 스테이지 진출 ➔');
    expect(host.querySelector('.survivors-ready-launch')?.textContent).toContain('STAGE 02');
    expect(host.querySelector('.survivors-mission-brief')?.textContent).toContain(PATROL_STAGES.stage_02.description);
    expect(host.querySelector('.survivors-ready-dialog')).not.toBeNull();
  } finally { act(() => root.unmount()); host.remove(); localStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); }
});
