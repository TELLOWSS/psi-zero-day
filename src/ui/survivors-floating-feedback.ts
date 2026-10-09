export interface FloatingFeedback {
  id: number;
  x: number;
  y: number;
  text: string;
  life: number;
  isCrit?: boolean;
  priority?: boolean;
}

/** Fit to the visible world interval, not to the full map or CSS viewport. */
export function fitFeedbackToView(x: number, measuredWidth: number, scale: number, left: number, right: number) {
  const padding = Math.min(12, Math.max(0, right - left) * .1);
  const available = Math.max(1, right - left - padding * 2);
  const fittedScale = measuredWidth > 0 ? Math.min(scale, available / measuredWidth) : scale;
  const width = Math.max(0, measuredWidth) * fittedScale;
  return {x: Math.max(left + padding + width / 2, Math.min(right - padding - width / 2, x)), scale: fittedScale, width};
}

export interface FeedbackRect {left: number; right: number; top: number; bottom: number}

/** Place measured labels around protected art and earlier labels without moving events. */
export function placeFeedbackVertically(x: number, y: number, width: number, ascent: number, descent: number,
  top: number, bottom: number, obstacles: readonly FeedbackRect[]) {
  const gap = 6;
  const minY = top + ascent + gap, maxY = bottom - descent - gap;
  if (minY > maxY) return null;
  const clamp = (value: number) => Math.max(minY, Math.min(maxY, value));
  const candidates = [clamp(y)];
  for (const rect of obstacles) {
    candidates.push(clamp(rect.top - descent - gap), clamp(rect.bottom + ascent + gap));
  }
  candidates.sort((a, b) => Math.abs(a - y) - Math.abs(b - y) || a - b);
  for (const baseline of candidates) {
    const rect = {left: x - width / 2, right: x + width / 2, top: baseline - ascent, bottom: baseline + descent};
    if (obstacles.every(other => rect.right + gap <= other.left || rect.left - gap >= other.right ||
      rect.bottom + gap <= other.top || rect.top - gap >= other.bottom)) return {y: baseline, rect};
  }
  return null;
}

/** Presentation budget only; feedback events and rewards are never discarded. */
export function selectFloatingFeedback<T extends FloatingFeedback>(items: readonly T[], busy: boolean, limit=busy?6:9): T[] {
  const selected: T[] = [];
  const ordered = items.filter(item => item.life > 0).slice().sort((a, b) =>
    Number(Boolean(b.priority)) - Number(Boolean(a.priority)) ||
    Number(Boolean(b.isCrit)) - Number(Boolean(a.isCrit)) || b.id - a.id);
  for (const item of ordered) {
    if (selected.length >= limit) break;
    if (!item.priority && selected.some(other => other.text === item.text &&
      Math.hypot(other.x - item.x, other.y - item.y) < 90)) continue;
    selected.push(item);
  }
  const placed: T[] = [];
  for (const item of selected) {
    let y = item.y;
    // Priority entries keep their anchor; later nearby notices move above them.
    while (placed.some(other => Math.abs(other.x - item.x) < 120 && Math.abs(other.y - y) < 28)) y -= 28;
    placed.push({...item, y});
  }
  return placed.reverse();
}
