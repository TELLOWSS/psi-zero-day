import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { siteProfileById, siteProfileRegistry } from '../src/content/defense-site-profiles';
import {
  calculateRiskPriority, defaultRiskPriorityContext, riskPriorityContextFromRun,
} from '../src/engine/defense-risk-priority';
import { constructionMethodMatchesProject } from '../src/domain/defense-site-profile';
import { zeroBreachContent } from '../src/content/defense';

const profile = (id: string) => {
  const found = siteProfileById(id);
  if (!found) throw new Error('Missing site profile: ' + id);
  return found;
};

describe('G4 SITE-PROFILE-01 contract', () => {
  it('contains apartment new-build, remodeling, and data-center profiles without new risk IDs', () => {
    expect(new Set(siteProfileRegistry.profiles.map(item => item.projectArchetype))).toEqual(
      new Set(['APT_NEW_BUILD','APT_REMODEL','DATA_CENTER']),
    );
    expect(siteProfileRegistry.scoreNotice).toBe('GAME_PRIORITY_ONLY_NOT_STATUTORY_RISK_ASSESSMENT');
    for (const item of siteProfileRegistry.profiles) {
      expect(Object.keys(item.baseRiskModifiers).sort()).toEqual(
        ['ARMORED','BOSS','NORMAL','SWARM','SWIFT','VEILED'].sort(),
      );
    }
  });

  it('treats construction method as a compatible context, not an easy/hard rank', () => {
    expect(constructionMethodMatchesProject('APT_NEW_BUILD','BOTTOM_UP')).toBe(true);
    expect(constructionMethodMatchesProject('APT_NEW_BUILD','TOP_DOWN')).toBe(true);
    expect(constructionMethodMatchesProject('APT_REMODEL','STRUCTURAL_RECONFIGURATION')).toBe(true);
    expect(constructionMethodMatchesProject('DATA_CENTER','PHASED')).toBe(true);
    expect(constructionMethodMatchesProject('APT_NEW_BUILD','PHASED')).toBe(false);
    expect(constructionMethodMatchesProject('DATA_CENTER','TOP_DOWN')).toBe(false);
  });

  it('starts with process-specific representative risk priorities', () => {
    const cases = [
      ['apt-new-bottom-up-excavation',['ARMORED','SWIFT','VEILED']],
      ['apt-new-top-down-under-slab',['VEILED','SWARM','ARMORED']],
      ['apt-remodel-survey-isolation',['VEILED','ARMORED','SWARM']],
      ['apt-remodel-selective-demolition',['VEILED','ARMORED','SWARM']],
      ['data-center-mep-rough-in',['SWARM','NORMAL','VEILED']],
      ['data-center-commissioning',['VEILED','BOSS','SWARM']],
    ] as const;

    for (const [id, expected] of cases) {
      const item = profile(id);
      const result = calculateRiskPriority(item, defaultRiskPriorityContext(item));
      expect(result.top3.map(entry => entry.riskId), id).toEqual(expected);
      expect(result.entries.every(entry => entry.score >= 0 && entry.score <= 100)).toBe(true);
    }
  });

  it('lets a live weak signal change the ranking instead of only adding HP', () => {
    const item = profile('apt-new-bottom-up-excavation');
    const base = defaultRiskPriorityContext(item);
    const before = calculateRiskPriority(item, base);
    const after = calculateRiskPriority(item, {
      ...base,
      currentSignals: { VEILED: 1 },
    });

    expect(before.top3[0]?.riskId).toBe('ARMORED');
    expect(after.top3[0]?.riskId).toBe('VEILED');
    expect(after.entries.find(entry => entry.riskId === 'VEILED')!.score)
      .toBeGreaterThan(before.entries.find(entry => entry.riskId === 'VEILED')!.score);
  });

  it('makes as-built confidence meaningful for remodeling', () => {
    const item = profile('apt-remodel-survey-isolation');
    const uncertain = calculateRiskPriority(item, defaultRiskPriorityContext(item));
    const verified = calculateRiskPriority(item, {
      ...defaultRiskPriorityContext(item),
      asBuiltConfidence: 1,
    });
    expect(uncertain.entries.find(entry => entry.riskId === 'VEILED')!.score)
      .toBeGreaterThan(verified.entries.find(entry => entry.riskId === 'VEILED')!.score);
  });

  it('makes data-center live-critical energy state raise compound-event priority', () => {
    const item = profile('data-center-commissioning');
    const testing = calculateRiskPriority(item, defaultRiskPriorityContext(item));
    const live = calculateRiskPriority(item, {
      ...defaultRiskPriorityContext(item),
      energyState: 'LIVE_CRITICAL',
    });
    expect(testing.top3[0]?.riskId).toBe('VEILED');
    expect(live.top3[0]?.riskId).toBe('BOSS');
  });

  it('derives live signals and unresolved memory from the existing DefenseRunState without changing save schema', () => {
    const item = profile('apt-new-bottom-up-excavation');
    const run = {
      scenarioId:'training-ramp-v1',
      waveId:5,
      enemies:[
        { enemyId:'SWIFT' },
        { enemyId:'SWIFT' },
        { enemyId:'VEILED' },
      ],
      leakedByEnemy:{ VEILED:2 },
    } as any;
    const context = riskPriorityContextFromRun(item, run, zeroBreachContent);
    expect(context.currentSignals.SWIFT).toBe(0.5);
    expect(context.currentSignals.VEILED).toBe(0.25);
    expect(context.unresolvedHistory.VEILED).toBeCloseTo(2 / 3, 5);

    const domain = fs.readFileSync('src/domain/defense.ts','utf8');
    const runState = domain.slice(domain.indexOf('export interface DefenseRunState'), domain.indexOf('export type DefenseCommand'));
    expect(runState).not.toContain('projectArchetype');
    expect(runState).not.toContain('constructionMethod');
    expect(runState).not.toContain('processPhase');
  });

  it('renders the site profile and dynamic top-three HUD inside the one DefenseGame core', () => {
    const ui = fs.readFileSync('src/ui/DefenseGame.tsx','utf8');
    const hud = fs.readFileSync('src/ui/SiteRiskPriorityHud.tsx','utf8');
    expect(ui).toContain('siteProfileForScenario');
    expect(ui).toContain('riskPriorityContextFromRun');
    expect(ui).toContain('<SiteRiskPriorityHud');
    expect(hud).toContain('data-risk-top3');
    expect(hud).toContain('GAME_PRIORITY').not;
    expect(ui).not.toContain('SiteProfileDefenseGame');
  });
});
