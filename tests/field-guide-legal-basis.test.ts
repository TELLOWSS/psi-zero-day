import { describe, expect, it } from 'vitest';
import catalog from '../content/episode01/scene-element-catalog.json';
import legalBasis from '../content/episode01/field-guide-legal-basis.json';

describe('field guide KR legal basis', () => {
  const guideEntries = Object.entries(catalog.elements).filter(([, entry]) => entry.field_guide);
  const profileIds = new Set(Object.keys(legalBasis.profiles));

  it('covers every canonical field-guide item', () => {
    expect(guideEntries).toHaveLength(118);
    expect(Object.keys(legalBasis.items)).toHaveLength(118);
    for (const [key, entry] of guideEntries) {
      const legal = legalBasis.items[key as keyof typeof legalBasis.items];
      expect(legal, key).toBeDefined();
      expect(legal.field_guide_id).toBe(entry.field_guide?.id);
      expect(legal.bases.length, key).toBeGreaterThan(0);
    }
  });

  it('only references declared legal profiles', () => {
    for (const [key, item] of Object.entries(legalBasis.items)) {
      for (const basis of item.bases) {
        expect(profileIds.has(basis.profile), `${key}: ${basis.profile}`).toBe(true);
      }
    }
  });

  it('locks current Korean jurisdiction and review date', () => {
    expect(legalBasis.jurisdiction).toBe('KR');
    expect(legalBasis.reviewed_on).toBe('2026-09-23');
    expect(legalBasis.law_versions).toEqual(expect.arrayContaining([
      expect.objectContaining({ law: '산업안전보건법', effective_date: '2026-08-01' }),
      expect.objectContaining({ law: '산업안전보건기준에 관한 규칙', effective_date: '2026-03-02' }),
    ]));
  });

  it('keeps site-specific values out of universal statutory claims', () => {
    expect(legalBasis.items.gangform_lift_wire22.site_specific?.rule).toContain('not represented as a universal statutory diameter');
    expect(legalBasis.items.wind_meter.site_specific?.rule).toContain('Do not reuse tower-crane wind-speed thresholds');
  });
});
