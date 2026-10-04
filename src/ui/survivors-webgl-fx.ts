import type { PatrolStageId, Projectile } from '../domain/patrol-survivors';
import type { ProjectileFeedback } from '../domain/survivors-projectile-feedback';
import { cinematicLook } from './survivors-cinematic-vfx';

type Rgb = readonly [number, number, number];

export interface ProductionPulseSpec {
  readonly size: number;
  readonly life: number;
  readonly color: Rgb;
  readonly alpha: number;
  readonly ring: boolean;
}

interface ProductionPulse extends ProductionPulseSpec {
  readonly x: number;
  readonly y: number;
  age: number;
}

export interface ProductionFxFrame {
  readonly width: number;
  readonly height: number;
  readonly cameraX: number;
  readonly cameraY: number;
  readonly zoom: number;
  readonly dpr: number;
  readonly stageId: PatrolStageId;
  readonly reducedMotion: boolean;
  readonly floodlights: readonly { x: number; y: number; active: boolean }[];
  readonly player: { x: number; y: number };
  readonly premiumEquipped: boolean;
  readonly equipped: readonly string[];
  readonly projectiles: readonly Pick<Projectile, 'x' | 'y' | 'vx' | 'vy' | 'radius' | 'kind'>[];
}

/**
 * Graphics Vertical Slice 01 is intentionally limited to Stage 01.
 * The simulation remains authoritative; this layer only decorates verified projectile facts.
 */
export function productionPulseSpec(
  event: Readonly<ProjectileFeedback>,
  equipped: readonly string[] = [],
): ProductionPulseSpec | null {
  if (event.worker || event.phase === 'release') return null;
  if (!['radio', 'satellite_wave', 'drone_laser', 'hunter_beam', 'tesla_bolt', 'emf_beam', 'shout_shockwave'].includes(event.kind)) return null;

  const look = cinematicLook(event.kind, 5, equipped);
  const palette: Record<typeof look.palette, Rgb> = {
    gold: [1, 0.69, 0.24],
    cyan: [0.18, 0.78, 1],
    violet: [0.68, 0.36, 1],
  };
  const impact = event.phase === 'impact';
  const critical = Boolean(event.critical);
  const premium = look.premium;

  return {
    size: (impact ? 54 : 34) + (critical ? 14 : 0) + (premium ? 22 : 0),
    life: impact ? 0.20 : 0.11,
    color: palette[look.palette],
    alpha: Math.min(0.96, (impact ? 0.58 : 0.40) + (critical ? 0.12 : 0) + (premium ? 0.18 : 0)),
    ring: impact,
  };
}

const VERTEX_SHADER = `#version 300 es
precision mediump float;
in vec2 a_position;
in float a_size;
in vec4 a_color;
out vec4 v_color;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  gl_PointSize = a_size;
  v_color = a_color;
}`;

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;
in vec4 v_color;
out vec4 outColor;
void main() {
  vec2 p = gl_PointCoord - vec2(0.5);
  float d = length(p);
  if (d > 0.5) discard;
  float core = 1.0 - smoothstep(0.0, 0.18, d);
  float halo = 1.0 - smoothstep(0.08, 0.5, d);
  float alpha = (core * 0.82 + halo * 0.34) * v_color.a;
  outColor = vec4(v_color.rgb, alpha);
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export class SurvivorsWebglFx {
  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGL2RenderingContext | null;
  private readonly program: WebGLProgram | null;
  private readonly buffer: WebGLBuffer | null;
  private readonly positionLoc: number;
  private readonly sizeLoc: number;
  private readonly colorLoc: number;
  private readonly maxPointSize: number;
  private pulses: ProductionPulse[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });
    this.gl = gl;

    if (!gl) {
      this.program = null;
      this.buffer = null;
      this.positionLoc = -1;
      this.sizeLoc = -1;
      this.colorLoc = -1;
      this.maxPointSize = 0;
      return;
    }

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = vertex && fragment ? gl.createProgram() : null;
    if (program && vertex && fragment) {
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
    }
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);

    if (!program || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
      if (program) gl.deleteProgram(program);
      this.program = null;
      this.buffer = null;
      this.positionLoc = -1;
      this.sizeLoc = -1;
      this.colorLoc = -1;
      this.maxPointSize = 0;
      return;
    }

    this.program = program;
    this.buffer = gl.createBuffer();
    this.positionLoc = gl.getAttribLocation(program, 'a_position');
    this.sizeLoc = gl.getAttribLocation(program, 'a_size');
    this.colorLoc = gl.getAttribLocation(program, 'a_color');
    const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array | number[];
    this.maxPointSize = Number(range?.[1] ?? 64);

    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.disable(gl.DEPTH_TEST);
  }

  get available(): boolean {
    return Boolean(this.gl && this.program && this.buffer);
  }

  ingest(events: readonly ProjectileFeedback[], equipped: readonly string[], busy: boolean): void {
    const limit = busy ? 28 : 56;
    for (const event of events) {
      const spec = productionPulseSpec(event, equipped);
      if (!spec) continue;
      this.pulses.push({ ...spec, x: event.x, y: event.y, age: 0 });
    }
    if (this.pulses.length > limit) this.pulses.splice(0, this.pulses.length - limit);
  }

  advance(dt: number): void {
    const elapsed = Math.max(0, Math.min(0.1, dt));
    for (const pulse of this.pulses) pulse.age += elapsed;
    this.pulses = this.pulses.filter(pulse => pulse.age < pulse.life);
  }

  render(frame: ProductionFxFrame): void {
    const gl = this.gl;
    const program = this.program;
    const buffer = this.buffer;
    if (!gl || !program || !buffer) return;

    if (this.canvas.width !== frame.width) this.canvas.width = frame.width;
    if (this.canvas.height !== frame.height) this.canvas.height = frame.height;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (frame.stageId !== 'stage_01' || frame.reducedMotion) return;

    const vertices: number[] = [];
    const addPoint = (x: number, y: number, size: number, color: Rgb, alpha: number) => {
      const px = (x - frame.cameraX) * frame.zoom * frame.dpr;
      const py = (y - frame.cameraY) * frame.zoom * frame.dpr;
      if (px < -160 || py < -160 || px > frame.width + 160 || py > frame.height + 160) return;
      const ndcX = px / frame.width * 2 - 1;
      const ndcY = 1 - py / frame.height * 2;
      vertices.push(ndcX, ndcY, Math.min(this.maxPointSize, size * frame.zoom * frame.dpr), color[0], color[1], color[2], alpha);
    };

    // GPU light pools establish depth without changing collision, telegraphs or actor positions.
    for (const light of frame.floodlights) {
      if (light.active) {
        addPoint(light.x, light.y + 20, 154, [1, 0.73, 0.30], 0.082);
        addPoint(light.x, light.y - 8, 42, [1, 0.88, 0.58], 0.12);
      }
    }
    if (frame.premiumEquipped) {
      addPoint(frame.player.x, frame.player.y + 8, 122, [0.18, 0.78, 1], 0.075);
      addPoint(frame.player.x, frame.player.y - 18, 38, [0.70, 0.94, 1], 0.11);
    }

    // Live projectile splats turn the old hairline shots into a tapered optical trail.
    // This is presentation-only: the authoritative projectile coordinates remain untouched.
    const liveLimit = frame.projectiles.length > 90 ? 42 : 72;
    for (const projectile of frame.projectiles.slice(0, liveLimit)) {
      if (!['radio', 'satellite_wave', 'drone_laser', 'hunter_beam', 'tesla_bolt'].includes(projectile.kind)) continue;
      const look = cinematicLook(projectile.kind, 5, frame.equipped);
      const color: Rgb = look.palette === 'gold' ? [1, 0.69, 0.24] : look.palette === 'cyan' ? [0.18, 0.78, 1] : [0.68, 0.36, 1];
      const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
      const dx = projectile.vx / speed;
      const dy = projectile.vy / speed;
      const premium = look.premium;
      const trailLength = (premium ? 118 : 58) + look.tier * (premium ? 12 : 9);
      const samples = premium ? 9 : 6;
      for (let i = samples; i >= 1; i--) {
        const t = i / samples;
        const distance = trailLength * t;
        const taper = 1 - t * 0.70;
        addPoint(
          projectile.x - dx * distance,
          projectile.y - dy * distance,
          (premium ? 31 : 18) * taper + Math.max(2, projectile.radius * 0.55),
          color,
          (premium ? 0.34 : 0.15) * taper,
        );
      }
      addPoint(projectile.x, projectile.y, premium ? 38 : 22, color, premium ? 0.62 : 0.34);
      addPoint(projectile.x, projectile.y, premium ? 15 : 9, [1, 0.98, 0.88], premium ? 0.90 : 0.62);
    }

    for (const pulse of this.pulses) {
      const t = pulse.age / pulse.life;
      const fade = (1 - t) * (1 - t);
      addPoint(pulse.x, pulse.y, pulse.size * (1 + t * 0.48), pulse.color, pulse.alpha * fade);
      addPoint(pulse.x, pulse.y, pulse.size * 0.40, pulse.color, Math.min(1, pulse.alpha * 1.28) * fade);
      if (pulse.ring) {
        const radius = pulse.size * (0.28 + t * 0.72);
        const sparks = 8;
        for (let i = 0; i < sparks; i++) {
          const angle = i * Math.PI * 2 / sparks;
          addPoint(
            pulse.x + Math.cos(angle) * radius,
            pulse.y + Math.sin(angle) * radius * 0.55,
            8 + (1 - t) * 5,
            pulse.color,
            pulse.alpha * fade * 0.42,
          );
        }
      }
    }

    if (vertices.length === 0) return;
    const data = new Float32Array(vertices);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

    const stride = 7 * 4;
    gl.enableVertexAttribArray(this.positionLoc);
    gl.vertexAttribPointer(this.positionLoc, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(this.sizeLoc);
    gl.vertexAttribPointer(this.sizeLoc, 1, gl.FLOAT, false, stride, 2 * 4);
    gl.enableVertexAttribArray(this.colorLoc);
    gl.vertexAttribPointer(this.colorLoc, 4, gl.FLOAT, false, stride, 3 * 4);
    gl.drawArrays(gl.POINTS, 0, data.length / 7);
  }

  dispose(): void {
    const gl = this.gl;
    if (!gl) return;
    if (this.buffer) gl.deleteBuffer(this.buffer);
    if (this.program) gl.deleteProgram(this.program);
    this.pulses = [];
  }
}
