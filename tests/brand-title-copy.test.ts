import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

it('uses localized brand promise and the official accessible game title without implying Defense is released', () => {
  const hub = readFileSync(new URL('../src/ui/GameHub.tsx', import.meta.url), 'utf8');
  const copy = JSON.parse(readFileSync(new URL('../content/localization/playable-ko.json', import.meta.url), 'utf8'));
  expect(hub).toContain("t('ui.title.brand_descriptor')");
  expect(hub).toContain('aria-label={GAME_TITLE}');
  expect(hub).not.toContain('Proactive Safety Intelligence · FIELD DEFENSE');
  expect(JSON.stringify(copy)).toContain('오늘도 무사히 · 위험을 읽고 현장을 지킨다');
  expect(hub).toContain("setModePreview('defense')");
  expect(hub).toContain('시그널 워치 (SURVIVORS)');
});
