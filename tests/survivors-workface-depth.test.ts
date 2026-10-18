import {describe,expect,it,vi} from 'vitest';
import {PATROL_STAGE_IDS} from '../src/domain/patrol-survivors';
import {workfaceDepthLook,drawEssentialFootShadow,drawWorkfaceDepth,drawGradedWorkfaceFloor} from '../src/ui/survivors-workface-depth';

describe('Signal Watch shared stage 01–50 depth contract',()=>{
  it('applies a real authored-map grading profile to all fifty stages in every quality tier',()=>{
    expect(PATROL_STAGE_IDS).toHaveLength(50);
    for(const stageId of PATROL_STAGE_IDS){
      const low=workfaceDepthLook(stageId,'low');
      const high=workfaceDepthLook(stageId,'high');
      expect(low.floorFilter).toMatch(/^contrast\(1\./);
      expect(high.color).toMatch(/^#[0-9a-f]{6}$/);
      expect(high.nearShade).toBeGreaterThan(low.nearShade);
      expect(high.bounce).toBeGreaterThan(low.bounce);
      expect(low.nearShade).toBeGreaterThan(0);
    }
    expect(workfaceDepthLook('stage_01','high').floorFilter)
      .not.toBe(workfaceDepthLook('stage_50','high').floorFilter);
    expect(new Set(PATROL_STAGE_IDS.map(id=>workfaceDepthLook(id,'high').color)).size).toBe(6);
  });

  it('paints essential two-part foot contact without animation or device-quality dependency',()=>{
    const ctx={save:vi.fn(),restore:vi.fn(),translate:vi.fn(),beginPath:vi.fn(),ellipse:vi.fn(),fill:vi.fn()};
    drawEssentialFootShadow(ctx as unknown as CanvasRenderingContext2D,315,260);
    expect(ctx.translate).toHaveBeenCalledWith(315,260);
    expect(ctx.ellipse).toHaveBeenCalledTimes(2);
    expect(ctx.fill).toHaveBeenCalledTimes(2);
    expect(ctx.save).toHaveBeenCalledTimes(1);
    expect(ctx.restore).toHaveBeenCalledTimes(1);
  });

  it('grades a decoded stage raster once and reuses it without per-frame filtering',()=>{
    const paint={drawImage:vi.fn(),filter:'none',imageSmoothingEnabled:false,imageSmoothingQuality:'low'};
    const createElement=vi.fn(()=>({width:0,height:0,getContext:()=>paint}));
    vi.stubGlobal('document',{createElement});
    try {
      const ctx={drawImage:vi.fn()};
      const image={src:'/assets/survivors/maps/test-stage-42.webp'} as HTMLImageElement;
      drawGradedWorkfaceFloor(ctx as unknown as CanvasRenderingContext2D,image,'stage_42','balanced');
      drawGradedWorkfaceFloor(ctx as unknown as CanvasRenderingContext2D,image,'stage_42','balanced');
      expect(createElement).toHaveBeenCalledTimes(1);
      expect(paint.drawImage).toHaveBeenCalledTimes(1);
      expect(ctx.drawImage).toHaveBeenCalledTimes(2);
      expect(paint.filter).toBe('none');
    } finally {vi.unstubAllGlobals();}
  });

  it('caches world-size foreground/middle/far exposure without new geometry',()=>{
    const addColorStop=vi.fn();
    const painter={
      scale:vi.fn(),createLinearGradient:vi.fn(()=>({addColorStop})),
      createRadialGradient:vi.fn(()=>({addColorStop})),
      fillRect:vi.fn(),globalAlpha:1,fillStyle:'',
    };
    const layer={width:0,height:0,getContext:vi.fn(()=>painter)};
    const createElement=vi.fn(()=>({...layer}));
    vi.stubGlobal('document',{createElement});
    try{
      const ctx={drawImage:vi.fn()};
      drawWorkfaceDepth(ctx as unknown as CanvasRenderingContext2D,'stage_08','low');
      drawWorkfaceDepth(ctx as unknown as CanvasRenderingContext2D,'stage_08','low');
      drawWorkfaceDepth(ctx as unknown as CanvasRenderingContext2D,'stage_50','high');
      expect(createElement).toHaveBeenCalledTimes(2);
      expect(ctx.drawImage).toHaveBeenCalledTimes(3);
      expect(ctx.drawImage.mock.calls[0]?.slice(1)).toEqual([0,0,1400,900]);
    }finally{vi.unstubAllGlobals();}
  });
});
