// @vitest-environment jsdom
// These flow fixtures omit network image loading; readiness is verified in browser QA.
vi.mock('../src/ui/use-prepared-survivors-actor',()=>({usePreparedSurvivorsActor:(selected:string)=>selected}));
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { PatrolSurvivorsGame } from '../src/ui/PatrolSurvivorsGame';
import { SurvivorsEngine } from '../src/engine/patrol-survivors-engine';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });

it.each(['victory', 'defeat'] as const)('recovers a failed supply write and settles %s without losing or duplicating credits', phase => {
  const key = 'psi.survivors.store_wallet';
  localStorage.setItem(key, JSON.stringify({ credits: 10000, inventory: { owned: ['voice_lens'], equipped: ['voice_lens'], durability: { voice_lens: 100 } } }));
  let frame: FrameRequestCallback = () => {}, engine!: SurvivorsEngine;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frame = callback; return 1; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  const ctx = new Proxy({}, { get: (_, member) => member === 'createLinearGradient' || member === 'createRadialGradient'
    ? () => ({ addColorStop: vi.fn() }) : member === 'measureText' ? () => ({ width: 10 }) : vi.fn(), set: () => true });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as CanvasRenderingContext2D);
  const start = SurvivorsEngine.prototype.start;
  vi.spyOn(SurvivorsEngine.prototype, 'start').mockImplementation(function(this: SurvivorsEngine) { engine = this; start.call(this); });
  const host = document.createElement('div'), root = createRoot(host);
  document.body.append(host);
  const tick = () => act(() => frame(performance.now() + 16));
  try {
    act(() => root.render(<PatrolSurvivorsGame onExit={() => {}} audioMuted />));
    act(() => [...host.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === '시그널 워치 시작')!.click());
    vi.spyOn(engine, 'update').mockImplementation(() => {});
    const write = Storage.prototype.setItem;
    const failure = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function(this: Storage, name, value) {
      if (name === key) throw new Error('storage full');
      write.call(this, name, value);
    });
    engine.state.gameTime = 100;
    tick(); tick();
    expect(engine.state.psiCredits).toBe(120);
    expect(JSON.parse(localStorage.getItem(key)!).credits).toBe(10000);
    failure.mockRestore();
    act(() => host.querySelector<HTMLButtonElement>('.shop-continue-btn')!.click());
    engine.state.gameTime = 110;
    tick(); tick();
    expect(engine.state.psiCredits).toBe(300);
    expect(JSON.parse(localStorage.getItem(key)!).credits).toBe(10180);
    act(() => host.querySelector<HTMLButtonElement>('.shop-continue-btn')!.click());
    vi.mocked(engine.update).mockImplementation(() => {
      engine.state.phase = phase;
      engine.state.psiCredits = 350;
      engine.state.starsEarned = phase === 'victory' ? [true, false, false] : [false, false, false];
    });
    tick(); tick(); tick();
    const wallet = JSON.parse(localStorage.getItem(key)!);
    expect(wallet.credits).toBe(phase==='victory'?11000:10350);
    expect(wallet.clearRewardClaims??[]).toEqual(phase==='victory'?['stage_01']:[]);
    expect(wallet.inventory.owned).toEqual(['voice_lens']);
    expect(wallet.inventory.durability.voice_lens).toBe(phase === 'victory' ? 85 : 100);
    if (phase === 'defeat') {
      expect(host.querySelector('#survivors-result-title')?.textContent).toContain('대응 중단');
      expect(host.textContent).toContain('방호 한계에 도달해 이번 작전을 중단했습니다.');
      expect(host.textContent).not.toContain('현장에 사고가 발생했습니다');
    }
  } finally { act(() => root.unmount()); host.remove(); }
});
