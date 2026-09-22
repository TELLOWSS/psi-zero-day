import { useEffect, useRef, useState } from 'react';
import type { DefenseContent, DefenseRunState } from '../domain/defense';
import { defenseText as t } from '../app/defense-text';
import { readDefenseTutorialSeen, writeDefenseTutorialSeen } from '../app/defense-tutorial';

type TutorialStep = 'PLACE' | 'START' | 'WAIT_UPGRADE' | 'UPGRADE' | 'PREVIEW' | 'DONE';

function canAffordUpgrade(state: DefenseRunState, content: DefenseContent): boolean {
  return state.towers.some(tower => {
    if (tower.levelId !== 'L1') return false;
    const definition = content.towers.find(item => item.id === tower.towerId);
    const next = definition?.levels.find(level => level.from === 'L1');
    return Boolean(next && state.resource >= next.cost);
  });
}

export interface DefenseTutorialController {
  readonly step: TutorialStep;
  readonly visible: boolean;
  readonly pausedByGuide: boolean;
  skip(): void;
  finish(): void;
  replay(): void;
}

export function useDefenseTutorial(
  state: DefenseRunState | null,
  content: DefenseContent,
  setPaused: (paused: boolean) => void,
): DefenseTutorialController {
  const [step, setStep] = useState<TutorialStep>(() => readDefenseTutorialSeen() ? 'DONE' : 'PLACE');
  const pausedByGuide = useRef(false);

  const pauseForGuide = () => {
    if (!state || state.paused) return;
    pausedByGuide.current = true;
    setPaused(true);
  };

  const releaseGuidePause = () => {
    if (!pausedByGuide.current) return;
    pausedByGuide.current = false;
    setPaused(false);
  };

  useEffect(() => {
    if (!state || step === 'DONE') return;

    if (step === 'PLACE' && state.towers.length > 0) {
      setStep('START');
      return;
    }
    if (step === 'START' && state.status === 'RUNNING') {
      setStep('WAIT_UPGRADE');
      return;
    }
    if (step === 'WAIT_UPGRADE' && state.completedWaves >= 1 && state.status === 'INTERMISSION' && canAffordUpgrade(state, content)) {
      pauseForGuide();
      setStep('UPGRADE');
      return;
    }
    if (step === 'UPGRADE' && state.towers.some(tower => tower.levelId !== 'L1')) {
      setStep('PREVIEW');
    }
  }, [content, state, step]);

  const complete = () => {
    writeDefenseTutorialSeen(true);
    setStep('DONE');
    releaseGuidePause();
  };

  return {
    step,
    visible: step === 'PLACE' || step === 'START' || step === 'UPGRADE' || step === 'PREVIEW',
    pausedByGuide: pausedByGuide.current,
    skip: complete,
    finish: complete,
    replay() {
      writeDefenseTutorialSeen(false);
      if (state?.status === 'RUNNING' || state?.status === 'INTERMISSION') pauseForGuide();
      if (!state || state.towers.length === 0) setStep('PLACE');
      else if (state.status === 'READY') setStep('START');
      else if (state.towers.every(tower => tower.levelId === 'L1')) setStep('UPGRADE');
      else setStep('PREVIEW');
    },
  };
}

export function DefenseTutorial({
  controller,
}: {
  readonly controller: DefenseTutorialController;
}) {
  if (!controller.visible) return null;

  const copy = controller.step === 'PLACE'
    ? { title: t('defense.tutorial.place.title'), body: t('defense.tutorial.place.body'), target: 'placement' }
    : controller.step === 'START'
      ? { title: t('defense.tutorial.start.title'), body: t('defense.tutorial.start.body'), target: 'start' }
      : controller.step === 'UPGRADE'
        ? { title: t('defense.tutorial.upgrade.title'), body: t('defense.tutorial.upgrade.body'), target: 'upgrade' }
        : { title: t('defense.tutorial.preview.title'), body: t('defense.tutorial.preview.body'), target: 'preview' };

  return <aside className="zb-tutorial" data-tutorial-step={controller.step} data-target={copy.target} aria-live="polite">
    <small>{t('defense.tutorial.label')}</small>
    <strong>{copy.title}</strong>
    <p>{copy.body}</p>
    <div>
      <button type="button" onClick={controller.skip}>{t('defense.tutorial.skip')}</button>
      {controller.step === 'PREVIEW'
        ? <button type="button" className="is-primary" onClick={controller.finish}>{t('defense.tutorial.finish')}</button>
        : null}
    </div>
  </aside>;
}
