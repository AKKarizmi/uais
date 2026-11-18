"use client";
import {
  useSyncExternalStore,
  type SetStateAction,
  type Dispatch,
} from "react";
import { demoRepository, type Collections } from "@/lib/operations/service";

// Deliberately memory-only: navigation keeps the demo; a refresh resets it.
export function useDemoState<T extends Collections[keyof Collections]>(
  key: keyof Collections,
  seed: T,
): [T, Dispatch<SetStateAction<T>>] {
  const value = useSyncExternalStore(
    (listener) => demoRepository.subscribe(key, listener),
    () => demoRepository.read(key) as T,
    () => seed,
  );
  const set: Dispatch<SetStateAction<T>> = (next) => {
    const current = demoRepository.read(key) as T;
    const result =
      typeof next === "function" ? (next as (v: T) => T)(current) : next;
    demoRepository.replace(key, result);
  };
  return [value, set];
}
