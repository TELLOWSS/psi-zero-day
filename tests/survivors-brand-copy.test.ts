import { expect, it } from 'vitest';
import storeText from '../content/localization/survivors-store-ko.json';

it('names the equipment room by function rather than claiming premium quality', () => {
  expect(storeText.title).toBe('PSI 장비실');
  expect(storeText.noWear).not.toContain('프리미엄');
});

it('keeps ownership, repair and payment promises explicit', () => {
  expect(storeText.broken).toContain('사용 불가');
  expect(storeText.broken).toContain('수리로 복구');
  expect(storeText.repaired).toContain('장착을 선택');
  expect(storeText.intro).toContain('현금 결제 없음');
});
