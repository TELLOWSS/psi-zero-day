import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PlayableEpisode } from '../ui/PlayableEpisode';
import { EpisodeSession } from './episode-session';
import '../ui/playable.css';
import '../ui/strategy-map.css';

const session = new EpisodeSession();
document.title = session.t('ui.brand');
createRoot(document.getElementById('root')!).render(
  <StrictMode><PlayableEpisode session={session} /></StrictMode>,
);
