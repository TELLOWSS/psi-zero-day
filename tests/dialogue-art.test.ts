import { describe, expect, it } from 'vitest';
import { dialogueExpressionUri } from '../src/app/dialogue-art';

describe('dialogue expression projection', () => {
  it('only changes the matching speaker and line; missing variants preserve the base portrait fallback', () => {
    const resolve = (id: string) => id;
    expect(dialogueExpressionUri('kang_taesik', 'ep01.reactions.kang.high', resolve)).toBe('ep01.character.kang_taesik.supportive');
    expect(dialogueExpressionUri('kang_taesik', 'ep01.reactions.kang.low', resolve)).toBeUndefined();
    expect(dialogueExpressionUri('player', 'ep01.reactions.kang.high', resolve)).toBeUndefined();
    expect(dialogueExpressionUri(undefined, 'ep01.reactions.kang.high', resolve)).toBeUndefined();
    expect(dialogueExpressionUri('lim_junho', 'ep01.junho.signal', () => undefined)).toBeUndefined();
  });
});
