import { useEffect, useRef, useState } from 'react';
import type { SurvivorsGameState } from '../domain/patrol-survivors';
import { CHARACTER_PROFILES } from '../engine/patrol-survivors-engine';
import { drawPremiumGear } from './survivors-premium-render';
import { CHARACTER_MAP_ART } from './survivors-character-art';
import { EQUIPMENT_ART, PICKUP_ART, registerPropAtlas } from './survivors-equipment-art';
import { SpriteMotionTracker, drawGroundedSprite, registerSpriteBounds } from './survivors-sprite-motion';
import copy from '../../content/localization/survivors-store-ko.json';

export function SurvivorsFittingPreview({ state }: { state: SurvivorsGameState }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let disposed = false;
    setFailed(false); setLoaded(false);
    const load = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src;
    });
    Promise.all([load(CHARACTER_MAP_ART[state.characterId]), load(EQUIPMENT_ART), load(PICKUP_ART)])
      .then(([actor, gear, pickups]) => {
        if (disposed) return;
        const ctx = canvas.current?.getContext('2d'); if (!ctx) return;
        registerSpriteBounds(actor); registerPropAtlas(gear, 3, 5); registerPropAtlas(pickups, 4, 2);
        ctx.clearRect(0, 0, 360, 320);
        ctx.save(); ctx.translate(180, 285); ctx.scale(3, 3);
        const pose = new SpriteMotionTracker().sample(state.player, 0, 0, 0);
        drawGroundedSprite(ctx, actor, 74, pose);
        drawPremiumGear(ctx, { ...state, player: { ...state.player, x: 0, y: 0 } }, gear, true, 0, pickups);
        ctx.restore(); setLoaded(true);
      }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; };
  }, [state]);
  return <figure className="survivors-fitting-art">
    <canvas ref={canvas} width={360} height={320} role="img" aria-label={`${CHARACTER_PROFILES[state.characterId].name} ${copy.fitting}`}/>
    {!loaded && <figcaption role="status">{failed ? copy.fittingFailure : copy.fittingLoading}</figcaption>}
  </figure>;
}
