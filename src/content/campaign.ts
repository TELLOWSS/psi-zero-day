import { ContentRegistry } from './registry';
import { createEpisode01Registry } from './episode01';
import { episode02OpeningEvents, episode02Messages } from './episode02';

/**
 * Current vertical-slice campaign registry.
 * Episode 01 remains independently buildable/testable, while the live campaign can cross
 * the Day 01 -> Day 02 boundary without mutating the finished Episode 01 content contract.
 */
export function createCampaignRegistry(): ContentRegistry {
  const episode01 = createEpisode01Registry().getValidatedContent();
  const localization = episode01.localizations[0]!;
  return new ContentRegistry({
    ...episode01,
    localizations: [{
      ...localization,
      messages: { ...localization.messages, ...episode02Messages },
    }],
    events: [...episode01.events, ...episode02OpeningEvents],
  });
}
