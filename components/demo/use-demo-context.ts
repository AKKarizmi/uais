"use client";
import { useSyncExternalStore } from "react";
import { demoContextStore } from "@/lib/demo/context";
export function useDemoContext() {
  return useSyncExternalStore(
    demoContextStore.subscribe,
    demoContextStore.getSnapshot,
    demoContextStore.getServerSnapshot,
  );
}
