import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { demoContextStore } from "../lib/demo/context";
import { cleanup } from "@testing-library/react";
afterEach(cleanup);
beforeEach(() => demoContextStore.exit());
