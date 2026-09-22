import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type {
  DefenseCommand, DefenseContent, DefenseRunState, DefenseSaveDocument, DefenseSaveInspection, DefenseSupportId,
} from '../domain';
import { applyDefenseCommand, createDefenseRun, defenseResult } from '../engine/defense';
import type { StoragePort } from '../platform/storage';
import { browserLocalStoragePort } from '../platform/browser-storage';
import {
  applyDefenseOutcome, emptyDefenseSaveDocument, inspectDefenseSave, resumeDefenseRun,
  startCurrentVersionDocument, withDefenseActiveRun, writeDefenseSave,
} from './defense-save';
import { acquireDefenseTabGuard } from './defense-tab-guard';

export type DefenseEntryState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'select' }
  | { readonly kind: 'resume'; readonly savedAt: string; readonly run: DefenseRunState }
  | {
      readonly kind: 'version-mismatch';
      readonly savedAt: string;
      readonly savedRulesVersion: string;
      readonly savedContentVersion: string;
    }
  | { readonly kind: 'corrupt'; readonly issue: string }
  | { readonly kind: 'storage-error'; readonly issue: string }
  | { readonly kind: 'blocked' };

export type DefenseSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface DefensePersistenceController {
  readonly entry: DefenseEntryState;
  readonly state: DefenseRunState | null;
  readonly setState: Dispatch<SetStateAction<DefenseRunState | null>>;
  readonly document: DefenseSaveDocument;
  readonly saveStatus: DefenseSaveStatus;
  readonly saveError: string;
  readonly lastSavedAt: string | null;
  readonly conflict: boolean;
  readonly awardedCosmeticIds: readonly string[];
  startWithSupport(supportId: DefenseSupportId, portrait: boolean): void;
  resumeSavedRun(): void;
  discardSavedRun(): Promise<boolean>;
  dispatch(command: DefenseCommand): void;
  retryAfterResult(): void;
  retrySave(): Promise<boolean>;
  reloadAfterConflict(): Promise<void>;
  exitToMain(): Promise<boolean>;
}

function newRunId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `run-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function finished(run: DefenseRunState): boolean {
  return run.status === 'WON' || run.status === 'LOST';
}

export function useDefensePersistence(
  content: DefenseContent,
  onExit: () => void,
  providedStorage?: StoragePort,
): DefensePersistenceController {
  const [entry, setEntry] = useState<DefenseEntryState>({ kind: 'loading' });
  const [state, setStateInternal] = useState<DefenseRunState | null>(null);
  const [document, setDocument] = useState<DefenseSaveDocument>(() => emptyDefenseSaveDocument());
  const [saveStatus, setSaveStatus] = useState<DefenseSaveStatus>('idle');
  const [saveError, setSaveError] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [awardedCosmeticIds, setAwardedCosmeticIds] = useState<readonly string[]>([]);

  const storageRef = useRef<StoragePort | null>(providedStorage ?? null);
  const documentRef = useRef(document);
  const revisionRef = useRef(0);
  const stateRef = useRef<DefenseRunState | null>(null);
  const mountedRef = useRef(true);
  const guardReleaseRef = useRef<(() => void) | null>(null);
  const saveChainRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const settledUiRef = useRef(new Set<string>());
  const previousRunRef = useRef<DefenseRunState | null>(null);
  const exitingRef = useRef(false);

  const replaceDocument = useCallback((next: DefenseSaveDocument) => {
    documentRef.current = next;
    if (mountedRef.current) setDocument(next);
  }, []);

  const setState: Dispatch<SetStateAction<DefenseRunState | null>> = useCallback(update => {
    setStateInternal(previous => {
      const next = typeof update === 'function'
        ? (update as (value: DefenseRunState | null) => DefenseRunState | null)(previous)
        : update;
      stateRef.current = next;
      return next;
    });
  }, []);

  const saveDocument = useCallback((next: DefenseSaveDocument): Promise<boolean> => {
    replaceDocument(next);
    const task = saveChainRef.current.then(async () => {
      if (!storageRef.current) {
        if (mountedRef.current) {
          setSaveStatus('error');
          setSaveError('저장소를 사용할 수 없습니다.');
        }
        return false;
      }
      if (mountedRef.current) {
        setSaveStatus('saving');
        setSaveError('');
      }
      try {
        const written = await writeDefenseSave(storageRef.current, content, next, revisionRef.current);
        revisionRef.current = written.revision;
        if (mountedRef.current) {
          setSaveStatus('saved');
          setLastSavedAt(written.savedAt);
        }
        return true;
      } catch (error) {
        if (mountedRef.current) {
          setSaveStatus('error');
          setSaveError(error instanceof Error ? error.message : String(error));
        }
        return false;
      }
    });
    saveChainRef.current = task.then(() => true, () => true);
    return task;
  }, [content, replaceDocument]);

  const persistRun = useCallback((run: DefenseRunState): Promise<boolean> => {
    return saveDocument(withDefenseActiveRun(documentRef.current, run));
  }, [saveDocument]);

  const settleFinishedRun = useCallback(async (run: DefenseRunState) => {
    if (settledUiRef.current.has(run.runId)) return;
    settledUiRef.current.add(run.runId);
    const outcome = applyDefenseOutcome(documentRef.current, content, run, defenseResult(run));
    replaceDocument(outcome.document);
    setAwardedCosmeticIds(outcome.awardedCosmeticIds);
    await saveDocument(outcome.document);
  }, [content, replaceDocument, saveDocument]);

  const hydrate = useCallback(async () => {
    if (!storageRef.current) {
      try {
        storageRef.current = browserLocalStoragePort();
      } catch (error) {
        setEntry({ kind: 'storage-error', issue: error instanceof Error ? error.message : String(error) });
        return;
      }
    }

    const inspection: DefenseSaveInspection = await inspectDefenseSave(storageRef.current, content);
    if (!mountedRef.current) return;

    if (inspection.kind === 'storage-error') {
      setEntry({ kind: 'storage-error', issue: inspection.issue });
      return;
    }
    if (inspection.kind === 'corrupt') {
      revisionRef.current = 0;
      replaceDocument(emptyDefenseSaveDocument());
      setEntry({ kind: 'corrupt', issue: inspection.issue });
      return;
    }

    revisionRef.current = inspection.revision;
    replaceDocument(inspection.document);
    if (inspection.kind === 'empty') {
      setEntry({ kind: 'select' });
      return;
    }
    setLastSavedAt(inspection.savedAt);

    if (inspection.kind === 'version-mismatch') {
      setEntry({
        kind: 'version-mismatch',
        savedAt: inspection.savedAt,
        savedRulesVersion: inspection.savedRulesVersion,
        savedContentVersion: inspection.savedContentVersion,
      });
      return;
    }

    const savedRun = inspection.document.activeRun;
    if (!savedRun) {
      setEntry({ kind: 'select' });
      return;
    }
    if (finished(savedRun)) {
      await settleFinishedRun(savedRun);
      if (mountedRef.current) setEntry({ kind: 'select' });
      return;
    }
    setEntry({ kind: 'resume', savedAt: inspection.savedAt, run: savedRun });
  }, [content, replaceDocument, settleFinishedRun]);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    void acquireDefenseTabGuard(
      () => {
        if (cancelled || !mountedRef.current) return;
        setConflict(true);
        setState(current => current && !current.paused
          ? applyDefenseCommand(current, content, { type: 'SetPaused', paused: true })
          : current);
      },
      () => {
        if (cancelled || !mountedRef.current) return;
        setConflict(true);
        setState(current => current && !current.paused
          ? applyDefenseCommand(current, content, { type: 'SetPaused', paused: true })
          : current);
      },
    ).then(guard => {
      if (cancelled || !mountedRef.current) {
        guard.release();
        return;
      }
      if (guard.status === 'blocked') {
        setEntry({ kind: 'blocked' });
        return;
      }
      guardReleaseRef.current = guard.release;
      void hydrate();
    });

    return () => {
      cancelled = true;
      mountedRef.current = false;
      guardReleaseRef.current?.();
      guardReleaseRef.current = null;
    };
  }, [content, hydrate, setState]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const run = stateRef.current;
      if (!run || finished(run) || conflict) return;
      void persistRun(run);
    }, 2_000);
    return () => window.clearInterval(timer);
  }, [conflict, persistRun]);

  useEffect(() => {
    const run = state;
    if (!run) {
      previousRunRef.current = null;
      return;
    }
    const previous = previousRunRef.current;
    previousRunRef.current = run;

    if (finished(run)) {
      // Persist the terminal activeRun first. If the tab dies between this write and the
      // outcome write, hydration will settle the same runId exactly once.
      if (!previous || !finished(previous)) {
        void persistRun(run).then(() => settleFinishedRun(run));
      }
      return;
    }
    if (previous && (
      previous.paused !== run.paused
      || previous.completedWaves !== run.completedWaves
    )) {
      void persistRun(run);
    }
  }, [persistRun, settleFinishedRun, state]);

  const startWithSupport = useCallback((supportId: DefenseSupportId, portrait: boolean) => {
    let run = createDefenseRun(content, supportId, newRunId());
    if (portrait) run = applyDefenseCommand(run, content, { type: 'SetPaused', paused: true });
    stateRef.current = run;
    previousRunRef.current = run;
    setStateInternal(run);
    setEntry({ kind: 'select' });
    setAwardedCosmeticIds([]);
    void persistRun(run);
  }, [content, persistRun]);

  const resumeSavedRun = useCallback(() => {
    if (entry.kind !== 'resume') return;
    const run = resumeDefenseRun(entry.run);
    stateRef.current = run;
    previousRunRef.current = run;
    setStateInternal(run);
    setEntry({ kind: 'select' });
    void persistRun(run);
  }, [entry, persistRun]);

  const discardSavedRun = useCallback(async (): Promise<boolean> => {
    const base = entry.kind === 'corrupt'
      ? emptyDefenseSaveDocument()
      : startCurrentVersionDocument(documentRef.current);
    const ok = await saveDocument(base);
    if (ok && mountedRef.current) {
      stateRef.current = null;
      setStateInternal(null);
      setAwardedCosmeticIds([]);
      setEntry({ kind: 'select' });
    }
    return ok;
  }, [entry.kind, saveDocument]);

  const dispatch = useCallback((command: DefenseCommand) => {
    const current = stateRef.current;
    if (!current || conflict) return;
    try {
      const next = applyDefenseCommand(current, content, command);
      stateRef.current = next;
      setStateInternal(next);
      if (command.type === 'Build' || command.type === 'Upgrade' || command.type === 'Sell'
        || command.type === 'SetPaused' || command.type === 'StartWave') {
        void persistRun(next);
      }
    } catch (error) {
      throw error;
    }
  }, [conflict, content, persistRun]);

  const retryAfterResult = useCallback(() => {
    stateRef.current = null;
    previousRunRef.current = null;
    setStateInternal(null);
    setAwardedCosmeticIds([]);
    setEntry({ kind: 'select' });
  }, []);

  const retrySave = useCallback(async (): Promise<boolean> => {
    const run = stateRef.current;
    const next = run && !finished(run)
      ? withDefenseActiveRun(documentRef.current, run)
      : documentRef.current;
    return saveDocument(next);
  }, [saveDocument]);

  const reloadAfterConflict = useCallback(async () => {
    setConflict(false);
    stateRef.current = null;
    setStateInternal(null);
    setEntry({ kind: 'loading' });
    await hydrate();
  }, [hydrate]);

  const exitToMain = useCallback(async (): Promise<boolean> => {
    if (exitingRef.current) return false;
    exitingRef.current = true;
    try {
      const run = stateRef.current;
      if (run && !finished(run)) {
        const paused = run.paused ? run : applyDefenseCommand(run, content, { type: 'SetPaused', paused: true });
        stateRef.current = paused;
        setStateInternal(paused);
        if (!await persistRun(paused)) return false;
      } else if (run && finished(run)) {
        await settleFinishedRun(run);
        if (!await saveDocument(documentRef.current)) return false;
      } else {
        await saveChainRef.current;
      }
      onExit();
      return true;
    } finally {
      exitingRef.current = false;
    }
  }, [content, onExit, persistRun, saveDocument, settleFinishedRun]);

  return {
    entry, state, setState, document, saveStatus, saveError, lastSavedAt, conflict, awardedCosmeticIds,
    startWithSupport, resumeSavedRun, discardSavedRun, dispatch, retryAfterResult, retrySave,
    reloadAfterConflict, exitToMain,
  };
}
