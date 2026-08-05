import "@testing-library/jest-dom/vitest";

// jsdom does not implement ResizeObserver, which Radix Slider (used by
// AdvancedFilters) relies on to measure its thumb. Provide a minimal stub.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
  (globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
    ResizeObserverStub;
}