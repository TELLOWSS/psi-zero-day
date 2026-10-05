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
      expect(host.querySelector('.survivors-preflight-top h2')?.textContent).toBe('야간 긴급 순찰');
      expect(host.querySelector('.survivors-ready-dialog')?.getAttribute('data-preflight')).toBe('brief');
      const settings = Array.from(host.querySelectorAll('.survivors-preflight-tabs button')).find(button=>button.textContent==='설정')!;
      act(()=>settings.dispatchEvent(new MouseEvent('click',{bubbles:true})));
      expect(settings.getAttribute('aria-pressed')).toBe('true');
      expect(host.querySelector('.survivors-controls-guide')?.hasAttribute('hidden')).toBe(false);
      expect(host.querySelector('.survivors-preflight-panel')?.hasAttribute('hidden')).toBe(true);
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

  it('allows character selection and opening R&D and Arsenal modals', () => {
    const handleExit = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    try {
      act(() => {
        root.render(<PatrolSurvivorsGame onExit={handleExit} audioMuted={true} />);
      });

      // Verify 3 character selection cards exist
      expect(host.textContent).toContain('윤성호');
      expect(host.textContent).toContain('강태식');
      expect(host.textContent).toContain('현장 안전관리자');

      // Click Park Ki-cheol
      const parkBtn = Array.from(host.querySelectorAll('.survivors-char-card')).find(
        card => card.textContent?.includes('강태식'),
      ) as HTMLButtonElement | undefined;
      expect(parkBtn).toBeDefined();

      act(() => {
        parkBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(parkBtn?.className).toContain('is-selected');

      // Click R&D Lab button
      const rdBtn = Array.from(host.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('PSI 상점'),
      );
      expect(rdBtn).toBeDefined();
      act(() => {
        rdBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(host.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe('PSI 프리미엄 장비실');

      // Close R&D modal
      const closeRdBtn = Array.from(host.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('완료 및 닫기'),
      );
      act(() => {
        closeRdBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      // Click Arsenal modal button
      const arsenalBtn = Array.from(host.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('대응 도구 진화 도감'),
      );
      expect(arsenalBtn).toBeDefined();
      act(() => {
        arsenalBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(host.textContent).toContain('5대 슈퍼 프로토콜 진화 도감');
      expect(host.textContent).toContain('위성 브로드캐스트');
      expect(host.textContent).toContain('극저온 액화질소 블리자드');
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  });

  it('renders 20 construction stage cards and allows stage selection', () => {
    const handleExit = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    try {
      localStorage.setItem('psi.survivors.unlocked_stages', JSON.stringify(['stage_01', 'stage_02', 'stage_03', 'stage_04', 'stage_05']));

      act(() => {
        root.render(<PatrolSurvivorsGame onExit={handleExit} audioMuted={true} />);
      });

      // Verify stage cards
      expect(host.textContent).toContain('작전 구역 선택 (현장 공정 20단계)');
      expect(host.textContent).toContain('STAGE 01');
      expect(host.textContent).toContain('서측 게이트 및 지상 복합 하역장');
      expect(host.textContent).toContain('STAGE 02');
      expect(host.textContent).toContain('대심도 기초 굴착 구역 (-4F)');
      expect(host.textContent).toContain('STAGE 03');
      expect(host.textContent).toContain('45층 초고층 메가 골조 슬래브');

      expect(host.querySelectorAll('.survivors-stage-card')).toHaveLength(20);
      expect(host.textContent).toContain('STAGE 10');
      expect(host.textContent).not.toContain('STAGE 010');
      // Click Stage 02
      const stage2Btn = Array.from(host.querySelectorAll('.survivors-stage-card')).find(
        card => card.textContent?.includes('STAGE 02'),
      ) as HTMLButtonElement | undefined;
      expect(stage2Btn).toBeDefined();

      act(() => {
        stage2Btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(stage2Btn?.className).toContain('is-selected');
    } finally {
      localStorage.removeItem('psi.survivors.unlocked_stages');
      act(() => root.unmount());
      host.remove();
    }
  });
});

