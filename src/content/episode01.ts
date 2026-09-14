import manifest from '../../content/episode01/manifest.json';
import characters from '../../content/episode01/characters.json';
import inspectionCharacters from '../../content/episode01/inspection-characters.json';
import relations from '../../content/episode01/relations.json';
import inspectionRelations from '../../content/episode01/inspection-relations.json';
import events from '../../content/episode01/events.json';
import consequenceEvents from '../../content/episode01/consequence-events.json';
import inspectionEvents from '../../content/episode01/inspection-events.json';
import ko from '../../content/episode01/ko.json';
import { ContentRegistry } from './registry';
import { assembleEpisode01Consequences } from './episode01-consequences';

/** Offline content entry point. Run identity and unrelated player baselines remain caller inputs. */
export function createEpisode01Registry(): ContentRegistry {
  return new ContentRegistry({
    ...manifest.bundle,
    localizations: [ko],
    characters: [...characters, ...inspectionCharacters],
    relations: [...relations, ...inspectionRelations],
    events: assembleEpisode01Consequences(events, consequenceEvents, inspectionEvents),
  });
}

export const episode01Manifest = manifest;
