import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SignalWatchLoadingScreen } from '../src/ui/SignalWatchLoadingScreen';

describe('SIGNAL WATCH approved A loading presentation', () => {
  it('renders the approved production artwork and an accessible live progress bar', () => {
    const html = renderToStaticMarkup(
      <SignalWatchLoadingScreen loadGame={async () => undefined} onComplete={() => undefined} onExit={() => undefined} />,
    );
    expect(html).toContain('/signal-watch-loading/signal-watch-a-v1.webp');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="0"');
    expect(html).toContain('PEOPLE');
    expect(html).not.toContain('NEW-PSI : ZERO DAY');
  });

  it('ships the full-resolution key art as optimized WebP', () => {
    const bytes = readFileSync(new URL('../public/signal-watch-loading/signal-watch-a-v1.webp', import.meta.url));
    expect(bytes.length).toBeGreaterThan(300_000);
    expect(bytes.subarray(0, 4).toString()).toBe('RIFF');
    expect(bytes.subarray(8, 12).toString()).toBe('WEBP');
  });
});
