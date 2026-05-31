"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "vinyl-archive:wishlist";

// Custom event so multiple components on the page stay in sync within one tab.
const EVENT = "wishlist-change";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  window.localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(EVENT));
}

// --- External store plumbing for useSyncExternalStore ---
let snapshot: string[] = [];

function subscribe(callback: () => void) {
  const handler = () => {
    snapshot = read();
    callback();
  };
  handler(); // prime the cached snapshot on subscribe
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

// Must return a referentially-stable value between changes.
function getSnapshot(): string[] {
  return snapshot;
}

function getServerSnapshot(): string[] {
  return snapshot;
}

/** localStorage-backed wishlist of record ids, shared across components. */
export function useWishlist() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((id: string) => {
    const current = read();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    write(next);
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, count: ids.length, toggle, has };
}
