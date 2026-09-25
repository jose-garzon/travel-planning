import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// No `test.globals` in vitest.config.ts, so @testing-library/react's
// automatic cleanup detection (which relies on a global `afterEach`)
// never runs. Every component test would otherwise leak into the
// next one.
afterEach(() => {
  cleanup();
});
