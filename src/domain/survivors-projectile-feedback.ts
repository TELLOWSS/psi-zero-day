import type { HazardType, ProjectileKind, WorkfaceSpecies } from './patrol-survivors';

/** Facts emitted by the simulation. Consumers may decorate but never alter rules. */
export interface ProjectileFeedback {
  readonly projectileId: string;
  readonly kind: ProjectileKind;
  readonly phase: 'launch' | 'impact' | 'release';
  readonly x: number;
  readonly y: number;
  readonly angle: number;
  readonly radius: number;
  readonly worker?: boolean;
  readonly critical?: boolean;
  readonly actorKind?: HazardType;
  readonly blocked?: boolean;
  readonly appliedDamage?: number;
  readonly species?: WorkfaceSpecies;
  readonly targetId?: string;
  readonly finishing?: boolean;
  readonly targetRadius?: number;
}
