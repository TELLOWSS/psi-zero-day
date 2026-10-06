// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { PatrolSurvivorsGame } from '../src/ui/PatrolSurvivorsGame';
import { SurvivorsEngine } from '../src/engine/patrol-survivors-engine';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });
it('Stage 01→02 stores stage_02 stars, unlocks stage_03, awards once and keeps result visible', () => {
  let frame: FrameRequestCallback = () => {};
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {frame = cb; return 1;});
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  const gradient = {addColorStop: vi.fn()};
  const ctx = new Proxy({}, {get: (_, key) => key === 'createLinearGradient' || key === 'createRadialGradient' ? () => gradient : key === 'measureText' ? () => ({width: 10}) : vi.fn(), set: () => true});
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as CanvasRenderingContext2D);
  let engine: SurvivorsEngine;
  const original = SurvivorsEngine.prototype.start;
  vi.spyOn(SurvivorsEngine.prototype, 'start').mockImplementation(function(this: SurvivorsEngine) {engine = this; original.call(this);});
  const host = document.createElement('div'); const root = createRoot(host);
  const click = (text: string) => act(() => {const btn = [...host.querySelectorAll('button')].find(b => b.textContent?.includes(text)); expect(btn).toBeDefined(); btn!.click();});
  const tick = () => act(() => frame(performance.now() + 16));
  try {
    act(() => root.render(<PatrolSurvivorsGame onExit={() => {}} audioMuted />));
    click('시그널 워치 시작');
    const win = () => { vi.spyOn(engine!, 'update').mockImplementation(() => {engine!.state.phase = 'victory'; engine!.state.psiCredits = 20; engine!.state.starsEarned = [true, false, true];}); tick(); };
    win();
    expect(engine!.state.stageId).toBe('stage_01');
    click('다음'); click('시그널 워치 시작');
    expect(engine!.state.stageId).toBe('stage_02');
    win(); tick(); tick();
    expect(engine!.state.phase).toBe('victory');
    const entries = Object.keys(localStorage).map(k => [k, localStorage.getItem(k)!] as const);
    expect(entries.some(([,v]) => v.includes('stage_03'))).toBe(true);
    expect(entries.some(([,v]) => v.includes('"stage_02":[true,false,true]'))).toBe(true);
    expect(entries.some(([k,v]) => k.includes('credits') && v === '40')).toBe(true);
  } finally { act(() => root.unmount()); }
});
it('blur and touchcancel pause play, key repeat does not resume it', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const host = document.createElement('div'); const root = createRoot(host);
  try {
    act(() => root.render(<PatrolSurvivorsGame onExit={() => {}} audioMuted />));
    act(() => [...host.querySelectorAll('button')].find(b => b.textContent === '시그널 워치 시작')!.click());
    act(() => {window.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyW'})); window.dispatchEvent(new Event('blur'));});
    expect(host.textContent).toContain('순찰 재개');
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyP', repeat: true})));
    expect(host.textContent).toContain('순찰 재개');
    act(() => [...host.querySelectorAll('button')].find(b => b.textContent === '순찰 재개')!.click());
    act(() => host.firstElementChild!.dispatchEvent(new Event('touchcancel', {bubbles: true})));
    expect(host.textContent).toContain('순찰 재개');
  } finally { act(() => root.unmount()); }
});
