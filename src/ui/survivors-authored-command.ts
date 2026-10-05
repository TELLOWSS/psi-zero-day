import { registerCommandSprite } from './survivors-sprite-motion';

export const PLAYER_COMMAND_ART = '/assets/survivors/player-command-v2.png';
let sheet: Promise<HTMLImageElement> | undefined;

/** Load before publishing the actor, so its body never changes during a live encounter. */
export async function loadAuthoredCommand(actor: HTMLImageElement): Promise<boolean> {
  if (!actor.src.endsWith('/player-map.webp')) return false;
  sheet ??= new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => { sheet = undefined; reject(new Error('Player command art unavailable')); };
    image.src = PLAYER_COMMAND_ART;
  });
  try { return registerCommandSprite(actor, await sheet); }
  catch { return false; }
}
