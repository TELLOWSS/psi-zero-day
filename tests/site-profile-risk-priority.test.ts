import { describe, expect, it } from 'vitest';
import { siteProfileById, siteProfiles } from '../src/content/site-profiles';
import { baselineRiskContext, calculateRiskPriorities, topRiskPriorities } from '../src/engine/risk-priority';

describe('G4 SITE-PROFILE-01', () => {
  it('loads validated project/method/process profile families', () => {
    expect(siteProfiles.length).toBeGreaterThanOrEqual(10);
    expect(new Set(siteProfiles.map(profile => profile.projectArchetype))).toEqual(
      new Set(['APT_NEW_BUILD','APT_REMODEL','DATA_CENTER']),
    );
  });

  it('keeps top-down under-slab as a different risk profile, not an easy/hard flag', () => {
    const profile = siteProfileById('apt-new-top-down-under-slab')!;
    const top = topRiskPriorities(profile, baselineRiskContext(profile.id));
    expect(top.map(row => row.riskId)).toEqual(['VEILED','SWARM','ARMORED']);
  });

  it('makes low as-built confidence materially raise remodeling uncertainty', () => {
    const profile = siteProfileById('apt-remodel-survey')!;
    const baseline = calculateRiskPriorities(profile, baselineRiskContext(profile.id));
    const lowConfidence = calculateRiskPriorities(profile, {
      ...baselineRiskContext(profile.id),
      uncertainty: 0.8,
      asBuiltConfidence: 'LOW',
      unresolvedSignals: { VEILED: 2 },
    });
    const before = baseline.find(row => row.riskId === 'VEILED')!;
    const after = lowConfidence.find(row => row.riskId === 'VEILED')!;
    expect(after.score).toBeGreaterThan(before.score);
    expect(after.rank).toBe(1);
    expect(after.reasons).toContain('도면-실물 신뢰도 낮음');
  });

  it('makes data-center commissioning react to energy state and concurrency', () => {
    const profile = siteProfileById('data-center-commissioning')!;
    const top = topRiskPriorities(profile, {
      ...baselineRiskContext(profile.id),
      energyState: 'LIVE_CRITICAL',
      concurrency: 0.8,
      uncertainty: 0.4,
    }, 4);
    expect(top[0]?.riskId).toBe('VEILED');
    expect(top.some(row => row.riskId === 'BOSS')).toBe(true);
    expect(top.some(row => row.riskId === 'ARMORED')).toBe(true);
  });

  it('lets world-state improvement reduce the calculated priorities', () => {
    const profile = siteProfileById('apt-new-top-down-under-slab')!;
    const stressed = calculateRiskPriorities(profile, {
      ...baselineRiskContext(profile.id),
      concurrency: 0.9,
      uncertainty: 0.9,
      logisticsCongestion: 0.9,
      groundwaterState: 'RISING',
      unresolvedSignals: { VEILED: 3, SWARM: 2, SWIFT: 2 },
    });
    const controlled = calculateRiskPriorities(profile, {
      ...baselineRiskContext(profile.id),
      concurrency: 0.25,
      uncertainty: 0.2,
      logisticsCongestion: 0.2,
      groundwaterState: 'NORMAL',
    });
    for (const riskId of ['VEILED','SWARM','SWIFT'] as const) {
      expect(controlled.find(row => row.riskId === riskId)!.score)
        .toBeLessThan(stressed.find(row => row.riskId === riskId)!.score);
    }
  });

  it('clamps every game-priority score to 0..100 and ranks all six risk families', () => {
    const profile = siteProfileById('data-center-electrical-ups')!;
    const rows = calculateRiskPriorities(profile, {
      ...baselineRiskContext(profile.id),
      concurrency: 99,
      uncertainty: 99,
      logisticsCongestion: 99,
      timePressure: 99,
      energyState: 'LIVE_CRITICAL',
      unresolvedSignals: { NORMAL: 9, SWIFT: 9, ARMORED: 9, SWARM: 9, VEILED: 9, BOSS: 9 },
    });
    expect(rows).toHaveLength(6);
    expect(rows.every(row => row.score >= 0 && row.score <= 100)).toBe(true);
    expect(rows.map(row => row.rank)).toEqual([1,2,3,4,5,6]);
  });
});
