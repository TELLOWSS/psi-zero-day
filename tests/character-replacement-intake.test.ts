import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import plan from '../content/episode01/character-replacement-plan.json';

describe('four-character replacement intake',()=>{
  const batch=fs.readFileSync(new URL('../scripts/stage-character-batch.mjs', import.meta.url),'utf8');
  const wrapper=fs.readFileSync(new URL('../scripts/stage-character-replacement.mjs', import.meta.url),'utf8');

  it('requires all eight replacement files instead of silently accepting legacy registered art',()=>{
    expect(batch).toContain("'require-all'");
    expect(batch).toContain("replacement batch requires source file");
    expect(plan.binary_replacement.required_filenames).toHaveLength(8);
  });

  it('runs strict binary and production gates after staging',()=>{
    expect(wrapper).toContain("check-character-replacement.mjs', '--require-new'");
    expect(wrapper).toContain("check-character-final-art-shape.mjs', '--batch-a'");
    expect(wrapper).toContain("build-episode01-assets.mjs', '--production-batch-a-check'");
  });

  it('keeps Main Loading MAP visual QA as a human approval step after binary intake',()=>{
    expect(plan.binary_replacement.completion_rule).toContain('main/loading/map visual QA');
    expect(wrapper).toContain('Main → Loading → MAP');
  });
});
