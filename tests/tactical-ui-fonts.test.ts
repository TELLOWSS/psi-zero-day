import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

describe('self-hosted tactical UI fonts',()=>{
  it('ships real unmodified font formats and redistribution licenses',()=>{
    for(const [file,signature] of [['PretendardVariable.woff2','wOF2'],['BlackHanSans-Regular.ttf','00010000'],['ChakraPetch-Bold.ttf','00010000']] as const){
      const bytes=readFileSync(`public/fonts/${file}`);
      expect(bytes.length).toBeGreaterThan(50000);
      expect(signature==='wOF2'?bytes.subarray(0,4).toString():bytes.subarray(0,4).toString('hex')).toBe(signature);
    }
    for(const file of ['Pretendard-LICENSE.txt','BlackHanSans-OFL.txt','ChakraPetch-OFL.txt']){
      expect(readFileSync(`public/fonts/${file}`,'utf8')).toContain('SIL OPEN FONT LICENSE');
    }
  });
  it('does not depend on a remote font runtime or fixed non-responsive widths',()=>{
    const css=readFileSync('src/ui/korean-typography.css','utf8');
    expect(css.match(/font-display: swap/g)).toHaveLength(3);
    expect(css).not.toMatch(/@import|url\(['"]?https?:/);
    expect(css).toContain('--psi-font-instrument');
    expect(css).toContain('font-weight: 100 900');
  });
});
