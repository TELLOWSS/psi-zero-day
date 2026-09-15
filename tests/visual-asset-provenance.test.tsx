import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { VisualImage, visualAssetTier } from '../src/ui/VisualSlot';

describe('TASK-016B visual asset provenance', () => {
  it('classifies the locked production-art precedence', () => {
    expect(visualAssetTier('assets/episode01/backgrounds/foundation-map.webp')).toBe('final');
    expect(visualAssetTier('assets/episode01/backgrounds/foundation-map-rc.svg')).toBe('rc');
    expect(visualAssetTier('assets/episode01/backgrounds/foundation-map.svg')).toBe('fallback');
    expect(visualAssetTier('assets/episode01/backgrounds/foundation-map.png')).toBe('other');
    expect(visualAssetTier(undefined)).toBeUndefined();
  });

  it('exposes the active tier on rendered image elements for acceptance checks', () => {
    const rcMarkup = renderToStaticMarkup(
      <VisualImage uri="assets/episode01/backgrounds/foundation-map-rc.svg" alt="" className="background-image" />,
    );
    const finalMarkup = renderToStaticMarkup(
      <VisualImage uri="assets/episode01/backgrounds/foundation-map.webp" alt="" className="background-image" />,
    );

    expect(rcMarkup).toContain('data-asset-tier="rc"');
    expect(finalMarkup).toContain('data-asset-tier="final"');
  });
});
