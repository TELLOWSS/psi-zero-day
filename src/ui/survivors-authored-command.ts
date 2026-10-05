import { registerCommandSprite } from './survivors-sprite-motion';
import {commandArtProfile} from './survivors-command-art';

export const PLAYER_COMMAND_ART = '/assets/survivors/player-command-v2.png';
const sheets = new Map<string,Promise<HTMLImageElement>>();

/** Load before publishing the actor, so its body never changes during a live encounter. */
export async function loadAuthoredCommand(actor: HTMLImageElement): Promise<boolean> {
  const profile=commandArtProfile(actor.src);if(!profile)return false;
  let sheet=sheets.get(profile.art);
  if(!sheet){sheet=new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => { sheets.delete(profile.art); reject(new Error('Character command art unavailable')); };
    image.src = profile.art;
  });sheets.set(profile.art,sheet);}
  try { return registerCommandSprite(actor, await sheet); }
  catch { return false; }
}
