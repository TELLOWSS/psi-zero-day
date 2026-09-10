import type { LocalizationCatalog, TextId } from '../domain';

export type Translate = (textId: TextId) => string;

/** Uses bundled dictionaries only. Missing translations fall back to default locale. */
export function createTranslator(
  catalogs: readonly LocalizationCatalog[], defaultLocale: string, locale = defaultLocale,
): Translate {
  const fallback = catalogs.find(c => c.locale === defaultLocale);
  if (!fallback) throw new Error(`Missing default locale: ${defaultLocale}`);
  const selected = catalogs.find(c => c.locale === locale) ?? fallback;
  return (textId) => {
    for (const catalog of [selected, fallback]) {
      if (Object.hasOwn(catalog.messages, textId)) return catalog.messages[textId]!;
    }
    throw new Error(`Missing text_id: ${textId}`);
  };
}
