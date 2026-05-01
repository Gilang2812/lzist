import { useState, useRef, useCallback } from 'react';

interface UndoableStateReturn<T> {
  state: T;
  setState: (updater: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Replace state without recording it in undo history (e.g. for initial load) */
  setWithoutHistory: (value: T) => void;
}

const MAX_HISTORY = 50;

export function useUndoableState<T>(initialState: T): UndoableStateReturn<T> {
  // We keep the actual value in a ref to avoid stale closures,
  // and drive renders via a version counter.
  const [, setVersion] = useState(0);
  const bump = useCallback(() => setVersion(v => v + 1), []);

  const currentRef = useRef<T>(initialState);
  const historyRef = useRef<T[]>([initialState]);
  const pointerRef = useRef<number>(0);

  const setState = useCallback((updater: T | ((prev: T) => T)) => {
    const prev = currentRef.current;
    const next = typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater;

    // Trim any future entries beyond current pointer
    historyRef.current = historyRef.current.slice(0, pointerRef.current + 1);

    // Push new state
    historyRef.current.push(next);

    // Enforce max history limit
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current = historyRef.current.slice(historyRef.current.length - MAX_HISTORY);
    }

    pointerRef.current = historyRef.current.length - 1;
    currentRef.current = next;
    bump();
  }, [bump]);

  const undo = useCallback(() => {
    if (pointerRef.current <= 0) return;
    pointerRef.current -= 1;
    currentRef.current = historyRef.current[pointerRef.current];
    bump();
  }, [bump]);

  const redo = useCallback(() => {
    if (pointerRef.current >= historyRef.current.length - 1) return;
    pointerRef.current += 1;
    currentRef.current = historyRef.current[pointerRef.current];
    bump();
  }, [bump]);

  const setWithoutHistory = useCallback((value: T) => {
    historyRef.current = [value];
    pointerRef.current = 0;
    currentRef.current = value;
    bump();
  }, [bump]);

  return {
    state: currentRef.current,
    setState,
    undo,
    redo,
    canUndo: pointerRef.current > 0,
    canRedo: pointerRef.current < historyRef.current.length - 1,
    setWithoutHistory,
  };
}
