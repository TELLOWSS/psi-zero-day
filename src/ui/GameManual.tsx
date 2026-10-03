import copy from '../../content/localization/game-manual-ko.json';
import { useEffect, useRef } from 'react';
import './game-manual.css';

export const gameManualText = (id: 'title' | 'open' | 'close') => copy[id];

export function GameManual({ onClose }: { readonly onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previous?.focus();
  }, []);
  return <div className="game-manual-backdrop">
    <section className="game-manual" role="dialog" aria-modal="true" aria-label={copy.title} tabIndex={-1}
      ref={dialogRef} onKeyDown={event => {
        event.stopPropagation();
        if (event.key === 'Escape') onClose();
        if (event.key === 'Tab') {
          const buttons = event.currentTarget.querySelectorAll<HTMLElement>('button, summary');
          const first = buttons[0]; const last = buttons[buttons.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}>
      <header><h2>{copy.title}</h2><button type="button" onClick={onClose}>{copy.close}</button></header>
      <p>{copy.intro}</p>
      {copy.sections.map(section => <details key={section.id} open={section.id === 'story'}>
        <summary>{section.title}</summary>
        <ol>{section.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
      </details>)}
    </section>
  </div>;
}
