import manifest from '../../content/episode01/manifest.json';
import characters from '../../content/episode01/characters.json';
import relations from '../../content/episode01/relations.json';
import events from '../../content/episode01/events.json';
import ko from '../../content/episode01/ko.json';
import { ContentRegistry } from './registry';

/** Offline content entry point. Run identity and unrelated player baselines remain caller inputs. */
export function createEpisode01Registry(): ContentRegistry {
  return new ContentRegistry({
    ...manifest.bundle,
    localizations: [ko],
    characters,
    relations,
    events,
  });
}

export const episode01Manifest = manifest;
