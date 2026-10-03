import { describe, expect, it } from 'vitest';
import { footTravel, soleContact } from '../src/ui/survivors-ground-contact';
import { ACTOR_RIGS } from '../src/ui/survivors-animation-rig';

describe('authored boot ground contact', () => {
  it('keeps stance planted during horizontal, vertical and diagonal travel at any sprite height', () => {
    for (const running of [false, true]) for (const dy of [-1, -.5, 0, .5, 1]) for (const height of [60, 72, 89]) {
      const stride = running ? 66 : 54;
      const dx = Math.sqrt(1 - dy * dy);
      const initial = soleContact({ x: .2, y: 1 }, .5, height, footTravel(0, false, running, dy, 1));
      for (let distance = 1; distance < stride * .49; distance++) {
        const travel = footTravel(distance / stride * Math.PI * 2, false, running, dy, 1);
        const foot = soleContact({ x: .2, y: 1 }, .5, height, travel);
        expect(foot.x + distance * dx).toBeCloseTo(initial.x, 8);
        expect(foot.y + distance * dy).toBeCloseTo(initial.y, 8);
        expect(travel.lift).toBe(0);
      }
    }
  });
  it('puts the ground shadow under each original boot instead of a generic actor centre', () => {
    for (const rig of Object.values(ACTOR_RIGS)) for (const sole of [rig.left.sole, rig.right.sole]) {
      const contact = soleContact(sole, .55, 74, { x: 0, y: 0 });
      expect(contact.x).toBeCloseTo((sole.x - .5) * .55 * 74);
      expect(contact.y).toBeCloseTo((sole.y - 1) * 74);
    }
  });
});
