import {describe,expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {OmegaSilverGuardReview,omegaGuardSourcePreviewAllowed} from '../src/ui/OmegaSilverGuardReview';

describe('REAL SIGNAL GUARD silver AIRA source review isolation',()=>{
 it('requires Guard and explicit repo review query in a Vite DEV build',()=>{
  expect(omegaGuardSourcePreviewAllowed(true,'?omegaSilverPreview=repo')).toBe(true);
  for(const query of ['', '?omegaSilverPreview=1','?omegaLab=1','?omegaSilverPreview=other'])
   expect(omegaGuardSourcePreviewAllowed(true,query)).toBe(false);
  expect(omegaGuardSourcePreviewAllowed(false,'?omegaSilverPreview=repo')).toBe(false);
 });
 it('never paints any observer while disabled, regardless of world coordinates',()=>{
  expect(renderToStaticMarkup(<svg><OmegaSilverGuardReview enabled={false}/></svg>))
   .toBe('<svg></svg>');
  expect(renderToStaticMarkup(<svg><OmegaSilverGuardReview enabled={false} worldX={-1} worldY={0}/></svg>))
   .toBe('<svg></svg>');
 });
});
