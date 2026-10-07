import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {SurvivorsResultSummary} from '../src/ui/SurvivorsResultSummary';
import copy from '../content/localization/survivors-result-ko.json';

it('presents zero credits truthfully with semantic summary and no invented bonus',()=>{
  const html=renderToStaticMarkup(<SurvivorsResultSummary credits={0} stats={[{label:copy.survival,value:'00:00'}]}/>);
  expect(html).toContain('+0');expect(html).toContain('<dl');expect(html).toContain('<dt');expect(html).toContain('<dd');
  expect(html).toContain(copy.credits);expect(html).not.toContain('bonus');
});
it('preserves authoritative values and readonly presentation input',()=>{
  const stats=Object.freeze([Object.freeze({label:copy.grade,value:'무사고',tone:'success' as const}),Object.freeze({label:copy.mastery,value:'ZERO DAY ×3'})]);
  const html=renderToStaticMarkup(<SurvivorsResultSummary credits={1234567} stats={stats}/>);
  expect(html).toContain('+1,234,567');expect(html).toContain('무사고');expect(html).toContain('ZERO DAY ×3');expect(html).toContain('data-tone="success"');
  expect(stats[1]!.value).toBe('ZERO DAY ×3');
});
