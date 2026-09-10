import { describe, expect, it } from 'vitest';
import { createTranslator } from '../src/localization/translator';
import type { LocalizationCatalog } from '../src/domain';

const catalogs: readonly LocalizationCatalog[] = [
  { locale: 'ko', messages: { 'test.one': '하나', 'test.two': '둘' } },
  { locale: 'en', messages: { 'test.one': 'One' } },
];

describe('localization', () => {
  it('resolves selected locale and falls back per missing key or locale', () => {
    const t = createTranslator(catalogs, 'ko', 'en');
    expect(t('test.one')).toBe('One'); expect(t('test.two')).toBe('둘');
    expect(createTranslator(catalogs, 'ko', 'fr')('test.one')).toBe('하나');
  });
  it('fails on missing keys and default dictionaries rather than displaying raw IDs', () => {
    expect(() => createTranslator(catalogs, 'fr')).toThrow('Missing default locale');
    const t = createTranslator(catalogs, 'ko');
    expect(() => t('missing')).toThrow('Missing text_id');
    expect(() => t('toString')).toThrow('Missing text_id');
  });
});
