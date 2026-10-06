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
it('uses native high-resolution mode scenes rather than enlarged thumbnails',async()=>{
  for(const mode of ['defense','story']){
    const image=await sharp(`public/mode-previews/${mode}-coming-soon-v2.webp`).metadata();
    expect(image.width).toBeGreaterThanOrEqual(1600);expect(image.height).toBeGreaterThanOrEqual(900);
  }
});
