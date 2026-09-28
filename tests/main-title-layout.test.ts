import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import layout from '../content/episode01/main-title-layout.json';
import production from '../content/episode01/character-art-production.json';
import replacement from '../content/episode01/character-replacement-plan.json';
import batchA from '../content/episode01/production-art-batch-a.json';

const titleCast = ['lim_junho', 'player', 'lee_jaehoon', 'seo_jeongmin'] as const;
const gameHubSource = readFileSync('src/ui/GameHub.tsx', 'utf8');
const gameHubCss = readFileSync('src/ui/game-hub.css', 'utf8');

describe('main title / loading / character production alignment', () => {
  it('uses one canonical four-character cast across title, loading and replacement plan', () => {
    expect(layout.composition.cast).toEqual(titleCast);
    expect(layout.loading.team_cast).toEqual(titleCast);
    expect(production.visual_uniqueness.main_title_cast).toEqual(titleCast);

    const replacementIds = replacement.batch
      .slice()
      .sort((a, b) => a.priority - b.priority)
      .map(entry => entry.id);
    expect(new Set(replacementIds)).toEqual(new Set(titleCast));
  });

  it('keeps Batch A exactly aligned to the four title characters plus the foundation world art', () => {
    expect(batchA.title_cast).toEqual(titleCast);
    const characterIds = [...new Set(
      batchA.assets
        .filter(asset => 'character_id' in asset)
        .map(asset => asset.character_id),
    )];
    expect(new Set(characterIds)).toEqual(new Set(titleCast));
    expect(batchA.assets.filter(asset => asset.kind === 'background')).toHaveLength(1);
    expect(batchA.assets.filter(asset => asset.kind === 'portrait')).toHaveLength(4);
    expect(batchA.assets.filter(asset => asset.kind === 'map')).toHaveLength(4);
  });

  it('requires each title character to have a distinct identity contract on primary visual axes', () => {
    const byId = new Map(production.characters.map(character => [character.id, character]));
    const selected = titleCast.map(id => byId.get(id));
    expect(selected.every(Boolean)).toBe(true);

    type Character = NonNullable<(typeof selected)[number]>;
    const axes: Array<(character: Character) => string> = [
      character => character.face_key,
      character => character.silhouette,
      character => character.helmet_key,
      character => character.wardrobe_key,
      character => character.signature_prop,
      character => character.age_band,
    ];

    for (const axis of axes) {
      const values = selected.map(character => axis(character!));
      expect(new Set(values).size).toBe(titleCast.length);
    }
  });

  it('locks H-01 commercial title hierarchy around title, slogan and Field Defense CTA', () => {
    expect(layout.commercialPresentation.h01.status).toMatch(/IMPLEMENTED|PASS/);
    expect(layout.commercialPresentation.h01.hierarchy.slice(0, 3).map(item => item.text)).toEqual([
      'PSI : ZERO DAY',
      '사고 전 신호를 읽고, 현장을 바꿔라.',
      '현장 디펜스 시작',
    ]);
    expect(layout.commercialPresentation.h01.eyebrow).toBe('NEW PSI');
    expect(layout.commercialPresentation.h01.desktopHeroWidthMaxVw).toBeLessThanOrEqual(52);
    expect(layout.commercialPresentation.h01.briefCopy)
      .toBe('같은 안전관리자라도 현장·공법·공정이 달라지면 읽어야 할 위험은 달라집니다.');
  });

  it('keeps the generated concept as art direction while runtime controls stay live DOM', () => {
    expect(layout.runtime_rules).toContain('all menu controls must remain clickable DOM elements');
    expect(layout.runtime_rules).toContain('generated concept images are art direction only and must not bake functional buttons into runtime');
    expect(layout.composition.cast_mode).toBe('full_body_live_assets');
  });

  it('makes the LIVE SITE DEF-CORE card a real representative-scenario entry on phone', () => {
    expect(gameHubSource).toContain('data-title-live-entry="DEF-CORE-01"');
    expect(gameHubSource).toContain('onClick={() => onDefense(defenseEvents[0]?.id ?? null)}');
    expect(gameHubSource).toContain('대표 시나리오 바로 시작');
    expect(gameHubCss).toContain('.commercial-title-field-status.is-live-entry');
    expect(gameHubCss).toContain('.commercial-title-field-status-cta');
  });
});
