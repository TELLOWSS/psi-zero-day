import { describe, expect, it } from 'vitest';
import {
  ALLOWED_WORLD_MARK,
  BRAND_NAME,
  COMPANY_NAME,
  CONSTRUCTION_COMPANY_NAME,
  CONSTRUCTION_COMPANY_NAME_KO,
  FIELD_GUIDE_NAME,
  FIELD_MAP_NAME,
  GAME_TITLE,
  SITE_NAME,
  SITE_NAME_KO,
} from '../src/app/brand';
import naming from '../content/brand/naming-contract.json';
import ko from '../content/localization/playable-ko.json';

describe('NEW PSI canonical naming contract', () => {
  it('locks organization and product surfaces to the NEW PSI family', () => {
    expect(BRAND_NAME).toBe('NEW PSI');
    expect(COMPANY_NAME).toBe('NEW PSI');
    expect(GAME_TITLE).toBe('NEW PSI : ZERO DAY');
    expect(CONSTRUCTION_COMPANY_NAME).toBe('NEW PSI CONSTRUCTION');
    expect(CONSTRUCTION_COMPANY_NAME_KO).toBe('NEW PSI 건설');
    expect(SITE_NAME).toBe('NEW PSI ZERO SITE 01');
    expect(SITE_NAME_KO).toBe('NEW PSI 현장 01');
    expect(FIELD_GUIDE_NAME).toBe('NEW PSI FIELD GUIDE');
    expect(FIELD_MAP_NAME).toBe('NEW PSI FIELD');
    expect(ALLOWED_WORLD_MARK).toBe('NEW PSI');
    expect(naming.brand_name).toBe(BRAND_NAME);
    expect(naming.game_title).toBe(GAME_TITLE);
  });

  it('uses the same names in Korean runtime copy', () => {
    expect(ko.messages['ui.brand']).toBe(GAME_TITLE);
    expect(ko.messages['ui.company']).toBe(COMPANY_NAME);
    expect(ko.messages['ui.company.construction']).toBe(CONSTRUCTION_COMPANY_NAME);
    expect(ko.messages['ui.company.construction_ko']).toBe(CONSTRUCTION_COMPANY_NAME_KO);
    expect(ko.messages['ui.site.project']).toBe(SITE_NAME_KO);
    expect(ko.messages['ui.title.plaque']).toBe(CONSTRUCTION_COMPANY_NAME);
  });

  it('does not ship legacy title values or anonymous-company placeholders in canonical runtime copy', () => {
    const runtimeValues = Object.values(ko.messages);
    expect(runtimeValues).not.toContain('PSI : ZERO DAY');
    const runtimeCopy = JSON.stringify(ko.messages);
    for (const forbidden of ['OO건설', '○○건설', '익명회사']) {
      expect(runtimeCopy).not.toContain(forbidden);
    }
  });
});
