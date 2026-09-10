import type { ContentBundle, ValidatedContent } from '../domain';
import { contentBundleSchema } from './schemas';
import { validateReferences } from './validate-references';
import type { ReferenceIssue } from './validate-references';

export class ContentReferenceError extends Error {
  constructor(readonly issues: readonly ReferenceIssue[]) {
    super(issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'));
    this.name = 'ContentReferenceError';
  }
}

function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

/** Atomic construction: no partial registration or mutable collections escape. */
export class ContentRegistry {
  readonly bundle: ContentBundle;
  readonly #characters;
  readonly #events;
  readonly #endings;
  readonly #assets;

  constructor(input: unknown) {
    const parsed = contentBundleSchema.parse(input);
    const issues = validateReferences(parsed);
    if (issues.length) throw new ContentReferenceError(issues);
    this.bundle = freeze(parsed);
    this.#characters = new Map(this.bundle.characters.map(c => [c.id, c]));
    this.#events = new Map(this.bundle.events.map(e => [e.event_id, e]));
    this.#endings = new Map(this.bundle.endings.map(e => [e.ending_id, e]));
    this.#assets = new Map(this.bundle.asset_manifest.assets.map(a => [a.asset_id, a]));
    Object.freeze(this);
  }

  getCharacter(id: string) { return this.#characters.get(id); }
  getValidatedContent(): ValidatedContent { return this.bundle as ValidatedContent; }
  getEvent(id: string) { return this.#events.get(id); }
  getEnding(id: string) { return this.#endings.get(id); }
  getAsset(id: string) { return this.#assets.get(id); }
}
