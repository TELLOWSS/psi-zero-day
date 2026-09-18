import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('runtime bootstrap boundary',()=>{
  const source=fs.readFileSync(new URL('../src/app/main.tsx', import.meta.url),'utf8');

  it('does not eagerly import the episode engine/content runtime',()=>{
    expect(source).not.toContain("import { EpisodeSession } from './episode-session'");
    expect(source).toContain("import('./episode-session')");
  });

  it('loads hub, runtime and save support in parallel after a branded shell is painted',()=>{
    expect(source).toContain('Promise.all([');
    expect(source).toContain("import('../ui/GameHub')");
    expect(source).toContain('PSI : ZERO DAY');
    expect(source).toContain('현장을 준비하고 있습니다.');
  });
});
