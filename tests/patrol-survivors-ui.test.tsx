// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { PatrolSurvivorsGame } from '../src/ui/PatrolSurvivorsGame';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe('PatrolSurvivorsGame UI', () => {
  it('renders start screen with controls guide and launches patrol', () => {
    const handleExit = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    try {
      act(() => {
        root.render(<PatrolSurvivorsGame onExit={handleExit} audioMuted={true} />);
      });

      // Check title and guide
      expect(host.textContent).toContain('PSI: 야간 긴급 순찰 (SURVIVORS)');
      expect(host.textContent).toContain('순찰 시작하기');

      // Click start
      const startBtn = Array.from(host.querySelectorAll('button')).find(
        btn => btn.textContent === '순찰 시작하기'
      );
      expect(startBtn).toBeDefined();

      act(() => {
        startBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      // Should transition to active gameplay HUD
      expect(host.textContent).toContain('SAFE SCORE');
      expect(host.textContent).toContain('일시정지 (P)');
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  });

  it('triggers onExit callback when exiting from HUD', () => {
    const handleExit = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    try {
      act(() => {
        root.render(<PatrolSurvivorsGame onExit={handleExit} audioMuted={true} />);
      });

      // Click '현장 복귀' in top actions
      const exitBtn = Array.from(host.querySelectorAll('button')).find(
        btn => btn.textContent === '현장 복귀'
      );
      expect(exitBtn).toBeDefined();

      act(() => {
        exitBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(handleExit).toHaveBeenCalledTimes(1);
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  });
});
