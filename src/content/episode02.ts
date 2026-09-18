import manifest from '../../content/episode02/manifest.json';
import openingEvents from '../../content/episode02/opening-events.json';
import ko from '../../content/episode02/ko.json';
import type { EventDefinition } from '../domain';

export const episode02OpeningEvents = openingEvents as readonly EventDefinition[];
export const episode02Messages = ko.messages;
export const episode02Manifest = manifest;
