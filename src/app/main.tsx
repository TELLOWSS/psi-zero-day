import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PlayableEpisode } from '../ui/PlayableEpisode';
import { EpisodeSession } from './episode-session';
import { clearEpisodeSave, loadEpisodeSave, saveEpisodeState } from './episode-save';
import '../ui/playable.css';
import '../ui/strategy-map.css';
import '../ui/strategy-signals.css';
import '../ui/strategy-workers.css';
import '../ui/strategy-inspector.css';
import '../ui/strategy-frictions.css';
import '../ui/strategy-actions.css';
import '../ui/strategy-assets.css';
import '../ui/character-growth.css';
import '../ui/vertical-slice-polish.css';

const session = new EpisodeSession();
const storage = window.localStorage;
const saved = loadEpisodeSave(storage);
if (saved) {
  const restored = saved.content_version === session.contentVersion
    && session.resume(saved.payload, session.getSnapshot().revision);
  if (!restored) clearEpisodeSave(storage);
}

session.subscribe(() => {
  const snapshot = session.getSnapshot();
  if (snapshot.phase === 'playing' && snapshot.state) saveEpisodeState(storage, snapshot.state);
  else if (snapshot.phase === 'start' || snapshot.phase === 'complete') clearEpisodeSave(storage);
});

document.title = session.t('ui.brand');
createRoot(document.getElementById('root')!).render(
  <StrictMode><PlayableEpisode session={session} /></StrictMode>,
);
