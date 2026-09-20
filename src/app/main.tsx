import '../ui/playable.css';
import '../ui/korean-typography.css';
import '../ui/strategy-map.css';
import '../ui/strategy-signals.css';
import '../ui/strategy-workers.css';
import '../ui/strategy-inspector.css';
import '../ui/strategy-frictions.css';
import '../ui/strategy-actions.css';
import '../ui/strategy-assets.css';
import '../ui/character-growth.css';
import '../ui/vertical-slice-polish.css';
import '../ui/art-slice-014a.css';
import '../ui/art-slice-014b.css';
import '../ui/art-slice-014c.css';
import '../ui/art-slice-014d.css';
import '../ui/psi-cues.css';
import '../ui/resource-loop-015b.css';
import '../ui/replan-pass-015b2.css';
import '../ui/paid-support-015b3.css';
import '../ui/title-commercial-016a.css';
import '../ui/interaction-safety.css';
import '../ui/production-readability.css';
import '../ui/game-hub.css';
import '../ui/cinematic-world.css';
import '../ui/responsive-layout.css';
import '../ui/story-director.css';
import '../ui/emergency-ux-fix.css';
import '../ui/production-scenes.css';

const root = document.getElementById('root') as HTMLElement | null;
if (!root) throw new Error('Missing #root mount point');
const mount = root;

mount.innerHTML = `
  <main class="runtime-bootstrap" role="status" aria-live="polite">
    <div class="runtime-bootstrap-mark">NEW PSI</div>
    <strong>PSI : ZERO DAY</strong>
    <span>Proactive Safety Intelligence</span>
    <p>현장을 준비하고 있습니다.</p>
  </main>
`;

async function bootstrap() {
  const [
    react,
    reactDom,
    { GameShell },
    { EpisodeSession },
    saveModule,
  ] = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('../ui/GameHub'),
    import('./episode-session'),
    import('./episode-save'),
  ]);

  const session = EpisodeSession.directed();
  let storage: import('./episode-save').EpisodeSaveStorage | null = null;
  try { storage = window.localStorage; } catch { storage = null; }

  if (storage) {
    const saved = saveModule.loadEpisodeSave(storage);
    if (saved) {
      const restored = saved.content_version === session.contentVersion
        && session.resume(saved.payload, session.getSnapshot().revision);
      if (!restored) saveModule.clearEpisodeSave(storage);
    }

    session.subscribe(() => {
      const snapshot = session.getSnapshot();
      if ((snapshot.phase === 'playing' || snapshot.phase === 'complete') && snapshot.state) {
        saveModule.saveEpisodeState(storage!, snapshot.state);
      } else if (snapshot.phase === 'start') {
        saveModule.clearEpisodeSave(storage!);
      }
    });
  }

  document.title = session.t('ui.brand');
  mount.replaceChildren();
  reactDom.createRoot(mount).render(
    react.createElement(react.StrictMode, null, react.createElement(GameShell, { session })),
  );
}

void bootstrap().catch(error => {
  console.error('PSI runtime bootstrap failed', error);
  mount.innerHTML = `
    <main class="runtime-bootstrap runtime-bootstrap-error" role="alert">
      <div class="runtime-bootstrap-mark">NEW PSI</div>
      <strong>PSI : ZERO DAY</strong>
      <p>현장을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.</p>
    </main>
  `;
});
