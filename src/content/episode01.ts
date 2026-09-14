import manifest from '../../content/episode01/manifest.json';
import assets from '../../content/episode01/assets.json';
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
import { episode01TbmGapEvents, episode01TbmGapMessages } from './episode01-tbm';
import { episode01RestartEvents, episode01RestartMessages } from './episode01-restart';
import { episode01StopworkEvents, episode01StopworkMessages } from './episode01-stopwork';
import { episode01InstructionEvents, episode01InstructionMessages } from './episode01-instruction';
import { episode01RecordEvents, episode01RecordMessages } from './episode01-record';
import { ContentRegistry } from './registry';
import { assembleEpisode01Consequences } from './episode01-consequences';
import { structureEpisode01PlayableFlow } from './episode01-play-structure';

/** Offline content entry point. Run identity and unrelated player baselines remain caller inputs. */
export function createEpisode01Registry(): ContentRegistry {
  const assembledEvents = assembleEpisode01Consequences(
    events,
    consequenceEvents,
    inspectionEvents,
    [responsibilityClashEvent, reportReturnEvent],
    episode01TbmGapEvents,
    episode01RestartEvents,
    episode01StopworkEvents,
    episode01InstructionEvents,
    episode01RecordEvents,
  );

  return new ContentRegistry({
    ...manifest.bundle,
    asset_manifest: assets,
    localizations: [{ ...ko, messages: {
      ...ko.messages,
      ...inspectionKo.messages,
      ...responsibilityKo.messages,
      ...episode01TbmGapMessages,
      ...episode01RestartMessages,
      ...episode01StopworkMessages,
      ...episode01InstructionMessages,
      ...episode01RecordMessages,
    } }],
    characters: [...characters, ...inspectionCharacters, ...responsibilityCharacters],
    relations: [...relations, ...inspectionRelations, ...responsibilityRelations],
    events: structureEpisode01PlayableFlow(assembledEvents),
  });
}

export const episode01Manifest = manifest;
