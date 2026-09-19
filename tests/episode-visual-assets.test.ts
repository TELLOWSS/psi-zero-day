import { describe, expect, it } from 'vitest';
import { characterMapUri, characterPortraitUri, episode01BackgroundUri, projectCharacterVisualAssets } from '../src/app/episode-visual-assets';

const fake = (id:string) => `/asset/${id}`;

describe('episode visual assets lightweight boundary',()=>{
  it('resolves title character art without the scene-element catalog',()=>{
    expect(characterPortraitUri('player', fake)).toContain('player');
    expect(characterMapUri('lim_junho', fake)).toContain('ep01.character.lim_junho.map');
    expect(episode01BackgroundUri(fake)).toContain('background');
  });

  it('projects only character/background visuals for title and loading screens',()=>{
    const view=projectCharacterVisualAssets(['player','lim_junho'],fake);
    expect(Object.keys(view.characters)).toEqual(['player','lim_junho']);
    expect(view.background_uri).toBeTruthy();
    expect('scene_elements' in view).toBe(false);
  });
});
