import { episodeScene } from '../app/episode-scenes';
import './episode-scenes.css';

export function EpisodeSceneBrief({ eventId, t }: {
  readonly eventId: string | undefined;
  readonly t: (id: string) => string;
}) {
  const scene = episodeScene(eventId);
  if (!scene) return null;
  return <details className="episode-scene-brief" key={eventId} data-scene={scene}>
    <summary><span>{t(`ui.scene_flow.${scene}`)}</span><strong>{t('ui.scene_flow.objective')}</strong></summary>
    <p>{t(`ui.scene_flow.${scene}.hint`)}</p>
    <small>{t('ui.scene_flow.reminder')}</small>
  </details>;
}
