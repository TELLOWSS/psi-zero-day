import type { Hazard, PlayerStats } from '../domain/patrol-survivors';

/** Locked directions make equipment readable and let movement defeat a charge. */
export function updateHazardMotion(h: Hazard, player: PlayerStats, dt: number, speed: number): boolean {
  const motion = h.motion;
  if (!motion) return false;
  if(h.variant==='pulse_gas') {
    if(motion.phase==='approach') {
      const dx=player.x-h.x,dy=player.y-h.y,distance=Math.hypot(dx,dy)||1;
      if(distance<=90){motion.phase='warning';motion.timer=1.25;}
      else {h.x+=dx/distance*speed*dt;h.y+=dy/distance*speed*dt;}
      return true;
    }
    motion.timer=Math.max(0,motion.timer-dt);
    if(motion.timer===0){
      if(motion.phase==='warning'){motion.phase='charge';motion.timer=.65;}
      else {motion.phase='approach';motion.timer=0;}
    }
    return true;
  }
  if (h.type === 'FALLING_DEBRIS') {
    motion.timer = Math.max(0, motion.timer - dt);
    if (motion.timer === 0 && motion.phase === 'warning') {
      motion.phase = 'fall'; motion.timer = 0.65;
    } else if (motion.timer === 0 && motion.phase === 'fall') {
      motion.phase = 'spent'; motion.timer = h.isStageBoss ? 3 : 0.4;
    } else if (motion.timer === 0 && motion.phase === 'spent' && h.isStageBoss && h.hp > 0) {
      // A designated operation risk persists until controlled; each new warning
      // locks the newly observed position and leaves the usual escape window.
      h.x = Math.max(60, Math.min(1340, player.x));
      h.y = Math.max(60, Math.min(840, player.y));
      motion.phase = 'warning'; motion.timer = 1.25;
    }
    return true;
  }
  if (h.type !== 'RUNAWAY_CART') return false;
  const dx = player.x - h.x;
  const dy = player.y - h.y;
  const distance = Math.hypot(dx, dy) || 1;
  if (motion.phase === 'approach') {
    if (distance <= 320) {
      motion.phase = 'warning';
      motion.timer = h.isStageBoss ? 1.2 : 0.9;
      motion.directionX = dx / distance;
      motion.directionY = dy / distance;
    } else {
      h.x += dx / distance * speed * 0.65 * dt;
      h.y += dy / distance * speed * 0.65 * dt;
    }
    return true;
  }
  motion.timer = Math.max(0, motion.timer - dt);
  if (motion.phase === 'charge') {
    const burst=h.variant==='reinforced_cart'&&h.hp<h.maxHp*.5?1.35:1;
    h.x += motion.directionX * speed * 2.1 * burst * dt;
    h.y += motion.directionY * speed * 2.1 * burst * dt;
  }
  if (motion.timer === 0) {
    if (motion.phase === 'warning') {
      motion.phase = 'charge'; motion.timer = 1.05;
    } else if (motion.phase === 'charge') {
      motion.phase = 'cooldown'; motion.timer = 1.1;
    } else {
      motion.phase = 'approach';
    }
  }
  return true;
}

export function isHazardContactActive(h: Hazard): boolean {
  if(h.variant==='pulse_gas')return h.motion?.phase==='charge';
  return h.type !== 'FALLING_DEBRIS' || !h.motion || h.motion.phase === 'fall';
}
