import foundation from '../../content/foundation.json';
import ko from '../../content/localization/ko.json';
import { ContentRegistry } from '../content/registry';
import { createTranslator } from '../localization/translator';

// Static imports keep foundation data and text local to the application bundle.
export const registry = new ContentRegistry({ ...foundation, localizations: [ko] });
export const translate = createTranslator(registry.bundle.localizations, registry.bundle.default_locale);
