import manifest from '../../content/episode01/manifest.json';
import characters from '../../content/episode01/characters.json';
import inspectionCharacters from '../../content/episode01/inspection-characters.json';
import responsibilityCharacters from '../../content/episode01/responsibility-characters.json';
import relations from '../../content/episode01/relations.json';
import inspectionRelations from '../../content/episode01/inspection-relations.json';
import responsibilityRelations from '../../content/episode01/responsibility-relations.json';
import events from '../../content/episode01/events.json';
import consequenceEvents from '../../content/episode01/consequence-events.json';
import inspectionEvents from '../../content/episode01/inspection-events.json';
import responsibilityClashEvent from '../../content/episode01/responsibility-clash-event.json';
import reportReturnEvent from '../../content/episode01/report-return-event.json';
import ko from '../../content/episode01/ko.json';
import inspectionKo from '../../content/episode01/inspection-ko.json';
import responsibilityKo from '../../content/episode01/responsibility-ko.json';
import { ContentRegistry } from './registry';
import { assembleEpisode01Consequences } from './episode01-consequences';

/** Offline content entry point. Run identity and unrelated player baselines remain caller inputs. */
export function createEpisode01Registry(): ContentRegistry {
  return new ContentRegistry({
    ...manifest.bundle,
    localizations: [{ ...ko, messages: { ...ko.messages, ...inspectionKo.messages, ...responsibilityKo.messages } }],
    characters: [...characters, ...inspectionCharacters, ...responsibilityCharacters],
    relations: [...relations, ...inspectionRelations, ...responsibilityRelations],
    events: assembleEpisode01Consequences(events, consequenceEvents, inspectionEvents, [responsibilityClashEvent, reportReturnEvent]),
  });
}

export const episode01Manifest = manifest;
