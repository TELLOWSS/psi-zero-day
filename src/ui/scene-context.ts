import data from '../../content/episode01/immersion.json';

export type SceneFocus = 'site' | 'formwork' | 'rebar' | 'coordination' | 'path';
export interface SceneContext {
  focus: SceneFocus;
  location_text_id: string;
  tension_text_id: string;
  opening?: boolean;
  introduction?: boolean;
}
export interface CharacterIntroduction { name_text_id?: string; domain_text_id: string; function_text_id: string }

/** Presentation metadata only: never determines event eligibility, speakers, or consequences. */
export function sceneContext(eventId?: string, textId?: string): SceneContext {
  const scene = (data.scenes as Record<string, SceneContext>)[eventId ?? ''] ?? data.scenes.e01_01_arrival as SceneContext;
  const shot = (data.shots as Record<string, Partial<SceneContext>>)[textId ?? ''];
  return { ...scene, ...shot };
}
export function characterIntroduction(id: string): CharacterIntroduction | undefined {
  return (data.characters as Record<string, CharacterIntroduction>)[id];
}
