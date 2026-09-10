import { TIME_SLOTS } from '../domain';
import type { GameTime, TimeSlot } from '../domain';

export function assertTime(time: GameTime): void {
  if (!Number.isSafeInteger(time.day) || time.day < 1 || !TIME_SLOTS.includes(time.slot)) {
    throw new Error('Invalid game clock');
  }
}
export function currentSlot(time: GameTime): TimeSlot { assertTime(time); return time.slot; }
export function nextSlot(time: GameTime): GameTime {
  assertTime(time);
  const index = TIME_SLOTS.indexOf(time.slot);
  const next: GameTime = index === 3
    ? { day: time.day + 1, slot: 'PRE_WORK' }
    : { day: time.day, slot: TIME_SLOTS[index + 1]! };
  assertTime(next);
  return next; // display_time is stale after advancing and is intentionally omitted.
}
export function compareTime(a: GameTime, b: GameTime): number {
  assertTime(a); assertTime(b);
  return a.day === b.day ? TIME_SLOTS.indexOf(a.slot) - TIME_SLOTS.indexOf(b.slot) : a.day - b.day;
}
