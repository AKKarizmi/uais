"use client";
import {
  useSyncExternalStore,
  type SetStateAction,
  type Dispatch,
} from "react";
import { demoRepository, type Collections } from "@/lib/operations/service";

// Deliberately memory-only: navigation keeps the demo; a refresh resets it.
const listeners = new Map<string, Set<() => void>>();
export function useDemoState<T extends Collections[keyof Collections]>(
  key: keyof Collections,
  seed: T,
): [T, Dispatch<SetStateAction<T>>] {
  const value = useSyncExternalStore(
    (listener) => {
      const collection = listeners.get(key) ?? new Set();
      listeners.set(key, collection);
      collection.add(listener);
      return () => {
        collection.delete(listener);
      };
    },
    () => demoRepository.read(key) as T,
    () => seed,
  );
  const set: Dispatch<SetStateAction<T>> = (next) => {
    const current = demoRepository.read(key) as T;
    const result =
      typeof next === "function" ? (next as (v: T) => T)(current) : next;
    demoRepository.replace(key, result);
    listeners.get(key)?.forEach((listener) => listener());
  };
  return [value, set];
}
