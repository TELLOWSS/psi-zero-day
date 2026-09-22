/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import type { EpisodeSession } from '../src/app/episode-session';
import { RecoverableFieldGuide } from '../src/ui/GameHub';

function buttonByText(host: HTMLElement, label: string): HTMLButtonElement {
  const button = [...host.querySelectorAll('button')].find(candidate => candidate.textContent === label);
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Missing button: ${label}`);
  return button;
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('Field guide chunk recovery', () => {
  it('creates a fresh lazy load attempt after the first chunk request fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const loader = vi.fn()
      .mockRejectedValueOnce(new Error('Failed to fetch dynamically imported module'))
      .mockResolvedValueOnce({ FieldGuide: () => <div data-testid="guide-ready">도감 정상</div> });
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(<RecoverableFieldGuide
        session={{ t: (id: string) => id } as EpisodeSession}
        onHome={() => undefined}
        loader={loader}
        onReload={() => undefined}
      />);
    });
    await flush();

    expect(host.querySelector('[role="alert"]')).not.toBeNull();
    expect(loader).toHaveBeenCalledTimes(1);

    await act(async () => {
      buttonByText(host, 'ui.guide.recovery.retry').click();
    });
    await flush();

    expect(loader).toHaveBeenCalledTimes(2);
    expect(host.querySelector('[data-testid="guide-ready"]')?.textContent).toBe('도감 정상');

    await act(async () => root.unmount());
    host.remove();
    consoleError.mockRestore();
  });

  it('offers home and explicit reload recovery without mutating the session', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onHome = vi.fn();
    const onReload = vi.fn();
    const loader = vi.fn().mockRejectedValue(new Error('chunk unavailable'));
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(<RecoverableFieldGuide
        session={{ t: (id: string) => id } as EpisodeSession}
        onHome={onHome}
        loader={loader}
        onReload={onReload}
      />);
    });
    await flush();

    buttonByText(host, 'ui.guide.recovery.home').click();
    buttonByText(host, 'ui.guide.recovery.reload').click();

    expect(onHome).toHaveBeenCalledTimes(1);
    expect(onReload).toHaveBeenCalledTimes(1);

    await act(async () => root.unmount());
    host.remove();
    consoleError.mockRestore();
  });
});
