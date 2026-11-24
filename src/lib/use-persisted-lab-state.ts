"use client";

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";

const EMPTY_SNAPSHOT = () => "";
const LAB_STORAGE_EVENT = "physics-lab-storage-changed";

function subscribeLabStorage(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(LAB_STORAGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(LAB_STORAGE_EVENT, listener);
  };
}

export function readLabStorageRaw(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

export function writeLabStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(LAB_STORAGE_EVENT));
  } catch {
    // Ignore storage quota / private mode errors cleanly
  }
}

/**
 * React 19 SSR-safe persisted lab state hook using useSyncExternalStore
 * (zero synchronous setState inside useEffect).
 */
export function usePersistedLabState<T>(
  key: string,
  initial: T,
  parse: (raw: unknown, fallback: T) => T
): readonly [T, (updater: T | ((prev: T) => T)) => void, () => void] {
  const raw = useSyncExternalStore(
    subscribeLabStorage,
    useCallback(() => readLabStorageRaw(key), [key]),
    EMPTY_SNAPSHOT
  );

  const state = useMemo<T>(() => {
    if (!raw) return initial;
    try {
      return parse(JSON.parse(raw), initial);
    } catch {
      return initial;
    }
  }, [raw, initial, parse]);

  const setState = useCallback(
    (updater: T | ((prev: T) => T)) => {
      const currentRaw = readLabStorageRaw(key);
      let current = initial;
      if (currentRaw) {
        try {
          current = parse(JSON.parse(currentRaw), initial);
        } catch {
          current = initial;
        }
      }
      const next =
        typeof updater === "function"
          ? (updater as (prev: T) => T)(current)
          : updater;
      writeLabStorage(key, next);
    },
    [key, initial, parse]
  );

  const resetState = useCallback(() => {
    writeLabStorage(key, initial);
  }, [key, initial]);

  return [state, setState, resetState] as const;
}

/**
 * Reports completion without firing false on passive mount (preventing remounts
 * when switching tabs/phases from wiping completedSectionIds in StudentLessonNotebook).
 */
export function useSyncLabProgress(
  done: boolean,
  onProgress?: (done: boolean) => void
): void {
  const hadCompleteRef = useRef(done);
  useEffect(() => {
    if (done || hadCompleteRef.current) {
      onProgress?.(done);
    }
    hadCompleteRef.current = done;
  }, [done, onProgress]);
}
