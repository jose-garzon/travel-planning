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

// jsdom doesn't implement ResizeObserver, but Radix UI primitives
// (e.g. Tooltip, via @radix-ui/react-use-size) call it on mount. No
// test in this codebase asserts on resize callback behavior, so a
// no-op stub is enough to let those components mount in jsdom.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverStub;
