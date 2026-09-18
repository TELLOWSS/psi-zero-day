import { useState } from 'react';
import { episodeScene, sceneIds } from '../app/episode-scenes';
import type { EpisodeSceneId } from '../app/episode-scenes';
import type { EpisodeReviewEntry } from '../app/episode-review';
import './episode-scenes.css';

/** Only displays choices and results actually visited by this run. */
export function EpisodeRecord({ entries, t }: {
  readonly entries: readonly EpisodeReviewEntry[];
  readonly t: (id: string) => string;
}) {
  const [filter, setFilter] = useState<EpisodeSceneId | 'all'>('all');
  const available = sceneIds.filter(id => entries.some(entry => episodeScene(entry.event_id) === id));
  const effectiveFilter = filter === 'all' || available.includes(filter) ? filter : 'all';
  const visible = entries.filter(entry => effectiveFilter === 'all' || episodeScene(entry.event_id) === effectiveFilter);
  return <section className="episode-record" aria-label={t('ui.review.title')}>
    <div className="episode-record-filters" role="group" aria-label={t('ui.scene_flow.filter')}>
      {(['all', ...available] as const).map(id => <button key={id} type="button" aria-pressed={effectiveFilter === id} onClick={() => setFilter(id)}>{t(`ui.scene_flow.${id}`)}</button>)}
    </div>
    <p className="episode-record-count" role="status">{t('ui.scene_flow.records')} · {visible.length}</p>
    <ol>{visible.map(entry => <li key={entry.key}>
      <strong>{t(entry.event_text_id)}</strong>
      <span>{t(entry.choice_text_id)}</span>
      {entry.result_text_id ? <p>{t(entry.result_text_id)}</p> : <p>{t('ui.scene_flow.no_result')}</p>}
    </li>)}</ol>
  </section>;
}
