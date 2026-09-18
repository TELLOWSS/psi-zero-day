import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EpisodeSession } from '../src/app/episode-session';
import { TITLE_CAST_IDS } from '../src/app/title-cast';
import { characterMapUri, projectCharacterVisualAssets } from '../src/app/episode-visual-assets';
import { CinematicLoadingScreen } from '../src/ui/CinematicLoadingScreen';
import { GameHub } from '../src/ui/GameHub';

describe('four-character Main Loading MAP QA contract',()=>{
  it('uses one canonical four-character cast order',()=>{
    expect(TITLE_CAST_IDS).toEqual(['lim_junho','player','lee_jaehoon','seo_jeongmin']);
  });

  it('marks all four characters on the main surface and loading surface',()=>{
    const session=new EpisodeSession();
    const main=renderToStaticMarkup(<GameHub session={session} onPlay={()=>{}} onNewGame={()=>{}} />);
    for(const id of TITLE_CAST_IDS){
      expect(main).toContain(`data-character="${id}"`);
    }
    expect(main.match(/data-art-surface="main"/g)?.length).toBe(4);

    const crew=TITLE_CAST_IDS.map(id=>({
      id,
      uri:characterMapUri(id,assetId=>session.assetUri(assetId)),
      name:session.character(id)?.name??id,
      role:session.character(id)?.role??'',
    }));
    const loading=renderToStaticMarkup(<CinematicLoadingScreen
      backgroundUri={session.assetUri('ep01.background.foundation.map')}
      preloadUris={crew.flatMap(item=>item.uri?[item.uri]:[])}
      crew={crew}
      onComplete={()=>{}}
    />);
    expect(loading.match(/data-art-surface="loading"/g)?.length).toBe(4);
    for(const id of TITLE_CAST_IDS){
      expect(loading).toContain(`data-character="${id}"`);
    }
  });

  it('resolves Main Loading and MAP character art from the same map asset bindings',()=>{
    const session=new EpisodeSession();
    const resolve=(assetId:string)=>session.assetUri(assetId);
    const map=projectCharacterVisualAssets(TITLE_CAST_IDS,resolve);
    for(const id of TITLE_CAST_IDS){
      const direct=characterMapUri(id,resolve);
      expect(direct).toBeTruthy();
      expect(map.characters[id]?.map_uri).toBe(direct);
      expect(direct).toMatch(/\.webp\?v=[a-f0-9]{12}$/);
    }
  });

  it('cache-busts replacement art with the manifest hash so a same-path WebP refresh is visible immediately',()=>{
    const session=new EpisodeSession();
    expect(session.assetUri('ep01.character.player.map'))
      .toMatch(/^assets\/episode01\/characters\/player-map\.webp\?v=[a-f0-9]{12}$/);
  });
});
