import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SurvivorsExtractionStatus } from '../src/ui/SurvivorsExtractionStatus';
import sharp from 'sharp';
it('keeps extraction instructions short and does not announce every countdown tick',()=>{
  const outside=renderToStaticMarkup(<SurvivorsExtractionStatus remaining={15} inside={false} />);
  expect(outside).toContain('중앙 LZ로 이동');
  expect(outside).toContain('타이머 정지');expect(outside).not.toContain('assertive');
  const inside=renderToStaticMarkup(<SurvivorsExtractionStatus remaining={4.2} inside />);
  expect(inside).toContain('LZ 사수 중');expect(inside).toContain('value="10"');expect(inside).not.toContain('role="dialog"');
});
it('handles invalid display values without changing extraction rules',()=>{
  expect(renderToStaticMarkup(<SurvivorsExtractionStatus remaining={NaN} inside />)).not.toContain('NaN');
  expect(renderToStaticMarkup(<SurvivorsExtractionStatus remaining={-1} inside />)).toContain('value="15"');
  const short=renderToStaticMarkup(<SurvivorsExtractionStatus remaining={8} total={10} inside />);
  expect(short).toContain('max="10"');expect(short).toContain('value="2"');
});
it('points from the player toward the LZ in every screen direction',()=>{
 const directions=[[1,0,'오른쪽'],[1,1,'오른쪽 아래'],[0,1,'아래'],[-1,1,'왼쪽 아래'],[-1,0,'왼쪽'],[-1,-1,'왼쪽 위'],[0,-1,'위'],[1,-1,'오른쪽 위']] as const;
 for(const [x,y,label] of directions){const markup=renderToStaticMarkup(<SurvivorsExtractionStatus remaining={15} inside={false} direction={{x,y}}/>);expect(markup).toContain(`${label} · 타이머 정지`);expect(markup).toContain('rotate(');expect(markup).toContain('hidden=""');}
 const inside=renderToStaticMarkup(<SurvivorsExtractionStatus remaining={12} inside direction={{x:1,y:1}}/>);expect(inside).not.toContain('rotate(');expect(inside).not.toContain('타이머 정지');
 for(const direction of [{x:0,y:0},{x:NaN,y:1}]){const markup=renderToStaticMarkup(<SurvivorsExtractionStatus remaining={15} inside={false} direction={direction}/>);expect(markup).not.toContain('rotate(');expect(markup).not.toContain('NaN');}
});
it('uses native high-resolution mode scenes rather than enlarged thumbnails',async()=>{
  for(const mode of ['defense','story']){
    const image=await sharp(`public/mode-previews/${mode}-coming-soon-v2.webp`).metadata();
    expect(image.width).toBeGreaterThanOrEqual(1600);expect(image.height).toBeGreaterThanOrEqual(900);
  }
});
