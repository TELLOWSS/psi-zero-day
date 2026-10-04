import type { Projectile } from '../domain/patrol-survivors';
import type { ProjectileFeedback } from '../domain/survivors-projectile-feedback';

export const BROADCAST_CROWN_ID = 'broadcast_crown';

const OPTICAL_KINDS = new Set(['radio', 'satellite_wave', 'drone_laser', 'hunter_beam']);

export function hasBroadcastCrown(equipped: readonly string[]): boolean {
  return equipped.includes(BROADCAST_CROWN_ID);
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  atlas: HTMLImageElement | undefined,
  cell: number,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha: number,
  angle = 0,
): boolean {
  if (!atlas?.naturalWidth || !atlas.naturalHeight || cell < 0 || cell > 11) return false;
  const cw = atlas.naturalWidth / 4;
  const ch = atlas.naturalHeight / 3;
  ctx.save();
  ctx.translate(x, y);
  if (angle) ctx.rotate(angle);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.drawImage(
    atlas,
    (cell % 4) * cw,
    Math.floor(cell / 4) * ch,
    cw,
    ch,
    -width / 2,
    -height / 2,
    width,
    height,
  );
  ctx.restore();
  return true;
}

/**
 * Production-grade visual pass for Broadcast Crown.
 * Presentation only: no projectile position, radius, damage, duration or collision mutation.
 */
export function drawBroadcastCrownFlight(
  ctx: CanvasRenderingContext2D,
  projectile: Readonly<Projectile>,
  atlas: HTMLImageElement | undefined,
  reducedMotion: boolean,
  busy: boolean,
): boolean {
  if (reducedMotion || !OPTICAL_KINDS.has(projectile.kind) || !atlas?.naturalWidth) return false;

  const angle = Math.atan2(projectile.vy, projectile.vx);
  const nx = -Math.sin(angle);
  const ny = Math.cos(angle);
  const alpha = Math.max(0, Math.min(1, projectile.duration / 0.12));
  const beam = projectile.kind === 'drone_laser' || projectile.kind === 'hunter_beam';
  const length = beam ? 112 : 92;
  const width = beam ? 19 : 17;
  const x = projectile.x - Math.cos(angle) * length * 0.22;
  const y = projectile.y - Math.sin(angle) * length * 0.22;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // Large low-alpha envelope gives the projectile volume without turning it white.
  drawCell(ctx, atlas, 4, x, y, length * 1.52, width * 2.35, alpha * (busy ? 0.20 : 0.30), angle);
  // Saturated middle body.
  drawCell(ctx, atlas, 4, x, y, length * 1.28, width * 1.18, alpha * (busy ? 0.50 : 0.68), angle);
  // Narrow high-energy core.
  drawCell(ctx, atlas, 4, x + Math.cos(angle) * 5, y + Math.sin(angle) * 5, length * 1.02, width * 0.42, alpha * 0.94, angle);
  // Hot projectile head.
  drawCell(ctx, atlas, 0, projectile.x, projectile.y, width * 1.55, width * 1.02, alpha * 0.96, angle);

  if (!busy) {
    // Two asymmetric side wisps break the flat "single line" look.
    drawCell(ctx, atlas, 4, x + nx * 6.5, y + ny * 6.5, length * 0.92, width * 0.30, alpha * 0.44, angle);
    drawCell(ctx, atlas, 4, x - nx * 5.0, y - ny * 5.0, length * 0.78, width * 0.25, alpha * 0.34, angle);
  }

  ctx.restore();
  return true;
}

/**
 * Draws a layered confirmed-contact response at the caller's local origin.
 * Worker confirmations are intentionally excluded from combat spectacle.
 */
export function drawBroadcastCrownContact(
  ctx: CanvasRenderingContext2D,
  event: Readonly<ProjectileFeedback>,
  age: number,
  duration: number,
  atlas: HTMLImageElement | undefined,
  reducedMotion: boolean,
  busy: boolean,
): boolean {
  if (
    reducedMotion ||
    event.worker ||
    event.phase === 'release' ||
    !OPTICAL_KINDS.has(event.kind) ||
    !atlas?.naturalWidth
  ) return false;

  const t = Math.max(0, Math.min(1, age / Math.max(0.001, duration)));
  const fade = (1 - t) * (1 - t);
  const impact = event.phase === 'impact';
  const critical = Boolean(event.critical);
  const base = impact ? (critical ? 68 : 56) : 34;
  const grow = impact ? 1 + t * 0.52 : 1 - t * 0.25;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // Outer luminous cloud + hard inner core.
  drawCell(ctx, atlas, impact ? 8 : 0, 0, 0, base * grow * 1.65, base * grow * 1.20, fade * (busy ? 0.30 : 0.58));
  drawCell(ctx, atlas, impact ? 8 : 0, 0, 0, base * grow * 0.88, base * grow * 0.88, fade * (busy ? 0.56 : 0.92));

  // Ground-facing shock rings provide the "weight" missing from the current flat hit marker.
  if (impact) {
    ctx.strokeStyle = '#ffd88b';
    ctx.lineWidth = critical ? 3.2 : 2.4;
    ctx.globalAlpha = fade * (busy ? 0.34 : 0.62);
    ctx.beginPath();
    ctx.ellipse(0, 4, base * (0.58 + t * 0.72), base * (0.20 + t * 0.28), 0, 0, Math.PI * 2);
    ctx.stroke();

    if (!busy) {
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = fade * 0.30;
      ctx.beginPath();
      ctx.ellipse(0, 5, base * (0.88 + t * 0.90), base * (0.27 + t * 0.36), 0, 0, Math.PI * 2);
      ctx.stroke();

      // Directional fragments: deterministic, no particle-object allocation.
      const fragmentCount = critical ? 10 : 8;
      for (let i = 0; i < fragmentCount; i++) {
        const a = event.angle + Math.PI + (i / (fragmentCount - 1) - 0.5) * 2.35;
        const distance = base * (0.30 + t * 0.72) * (i % 2 ? 0.82 : 1);
        const len = base * 0.18 * (1 - t);
        ctx.globalAlpha = fade * (i % 2 ? 0.38 : 0.68);
        ctx.strokeStyle = i % 2 ? '#ffc96c' : '#fff4c7';
        ctx.lineWidth = i % 2 ? 1.2 : 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * distance, Math.sin(a) * distance * 0.62 + t * t * 5);
        ctx.lineTo(Math.cos(a) * (distance + len), Math.sin(a) * (distance + len) * 0.62 + t * t * 5);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
  return true;
}

export function drawBroadcastCrownEmitter(
  ctx: CanvasRenderingContext2D,
  atlas: HTMLImageElement | undefined,
  x: number,
  y: number,
  time: number,
  reducedMotion: boolean,
): void {
  if (!atlas?.naturalWidth) return;
  const pulse = reducedMotion ? 1 : 1 + Math.sin(time * 3.2) * 0.06;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  ctx.strokeStyle = '#ffd88b';
  ctx.lineWidth = 2.2;
  ctx.globalAlpha = 0.62;
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 31 * pulse, 12 * pulse, 0, 0.10, Math.PI * 1.90);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.24;
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 43 * pulse, 17 * pulse, 0, Math.PI * 1.03, Math.PI * 1.77);
  ctx.stroke();

  drawCell(ctx, atlas, 0, x - 19, y - 30, 34, 24, 0.50 * pulse);
  ctx.restore();
}
