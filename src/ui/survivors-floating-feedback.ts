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

/** Presentation budget only; feedback events and rewards are never discarded. */
export function selectFloatingFeedback<T extends FloatingFeedback>(items: readonly T[], busy: boolean): T[] {
  const selected: T[] = [];
  const ordered = items.filter(item => item.life > 0).slice().sort((a, b) =>
    Number(Boolean(b.priority)) - Number(Boolean(a.priority)) ||
    Number(Boolean(b.isCrit)) - Number(Boolean(a.isCrit)) || b.id - a.id);
  for (const item of ordered) {
    if (selected.length >= (busy ? 6 : 9)) break;
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
