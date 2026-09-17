// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { VisualImage } from '../src/ui/VisualSlot';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

it('recovers a failed expression, stops after a failed base, and resets for a new speaker', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const fail = () => act(() => host.querySelector('img')!.dispatchEvent(new Event('error')));
  try {
    act(() => root.render(<VisualImage uri="expression.webp" fallbackUri="base.webp" alt="윤성호" />));
    expect(host.querySelector('img')?.getAttribute('data-loaded')).toBe('false');
    fail();
    expect(host.querySelector('img')?.getAttribute('src')).toBe('/base.webp');
    act(() => host.querySelector('img')!.dispatchEvent(new Event('load')));
    expect(host.querySelector('img')?.getAttribute('data-loaded')).toBe('true');
    fail();
    expect(host.querySelector('img')).toBeNull();
    act(() => root.render(<VisualImage uri="next-speaker.webp" fallbackUri="base.webp" alt="임준호" />));
    expect(host.querySelector('img')?.getAttribute('src')).toBe('/next-speaker.webp');
    expect(host.querySelector('img')?.getAttribute('data-loaded')).toBe('false');
  } finally { act(() => root.unmount()); }
});

it('does not loop when the primary and fallback are identical', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  try {
    act(() => root.render(<VisualImage uri="same.webp" fallbackUri="same.webp" alt="" />));
    act(() => host.querySelector('img')!.dispatchEvent(new Event('error')));
    expect(host.querySelector('img')).toBeNull();
  } finally { act(() => root.unmount()); }
});
