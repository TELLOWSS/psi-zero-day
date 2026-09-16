import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../src/ui/interaction-safety.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/app/main.tsx', import.meta.url), 'utf8');

describe('strategy interaction safety CSS contract', () => {
  it('loads the interaction override after all visual slice styles', () => {
    expect(main).toContain("import '../ui/interaction-safety.css';");
    expect(main.indexOf("import '../ui/interaction-safety.css';"))
      .toBeGreaterThan(main.indexOf("import '../ui/title-commercial-016a.css';"));
  });

  it('removes absolute overlays from inherited grid rows', () => {
    expect(css).toMatch(/\.strategy-active \.play-panel\s*\{[^}]*grid-row:\s*auto;/s);
    expect(css).toMatch(/\.strategy-active \.game-footer\s*\{[^}]*grid-row:\s*auto;/s);
  });

  it('keeps the continue and action controls at a 44px minimum target', () => {
    expect(css).toMatch(/\.strategy-active \.continue-button\s*\{[^}]*min-height:\s*44px;/s);
    expect(css).toMatch(/\.strategy-action-list button[\s\S]*min-height:\s*44px;/);
    expect(css).toMatch(/\.strategy-action-confirm-buttons button[\s\S]*min-height:\s*44px;/);
  });

  it('prevents the autosave status badge from intercepting pointer input', () => {
    expect(css).toMatch(/\.strategy-active \.save-hint\s*\{[^}]*pointer-events:\s*none;/s);
  });

  it('keeps dialogue scrollable rather than clipping long Korean content', () => {
    expect(css).toMatch(/\.strategy-active \.play-panel\s*\{[^}]*overflow:\s*auto;/s);
    expect(css).toMatch(/@media \(max-width: 1100px\), \(max-height: 680px\)[\s\S]*max-height:\s*30%;/);
  });

  it('gives bright-map resource tiles a stable dark contrast surface', () => {
    expect(css).toMatch(/\.strategy-resource-bar article\s*\{[^}]*background:\s*rgba\(18, 42, 58, \.84\);/s);
    expect(css).toMatch(/\.strategy-resource-bar article span\s*\{[^}]*opacity:\s*\.88;/s);
  });
});
