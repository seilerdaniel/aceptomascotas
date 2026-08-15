import { readFileSync } from "node:fs";
import path from "node:path";

// Vitest stubs CSS imports (no css:true in vite.config), so the raw text is
// read from disk instead of through the CSS plugin pipeline. vitest runs
// from the project root, so cwd-relative resolution is stable.
const cssText = readFileSync(path.resolve(process.cwd(), "src/index.css"), "utf-8");

// Design-token presence + dark-preservation coverage (spec: Token
// reconciliation, Organic shape/type/motion tokens, Reduced-motion guard).
// Reads the raw CSS text so assertions hold against the authored tokens.
describe("index.css design tokens", () => {
  it("defines the organic radius token", () => {
    expect(cssText).toContain("--radius-organic: 1.75rem");
  });

  it("defines type-role font-size tokens", () => {
    expect(cssText).toContain("--font-size-display:");
    expect(cssText).toContain("--font-size-heading:");
    expect(cssText).toContain("--font-size-body:");
    expect(cssText).toContain("--font-size-caption:");
  });

  it("defines motion tokens", () => {
    expect(cssText).toContain("--duration-fast:");
    expect(cssText).toContain("--duration-base:");
    expect(cssText).toContain("--duration-slow:");
    expect(cssText).toContain("--ease-out-soft:");
  });

  it("defines success/warning chip tokens and soft role variants", () => {
    expect(cssText).toContain("--success: 150 45% 40%");
    expect(cssText).toContain("--warning: 28 75% 50%");
    expect(cssText).toContain("--primary-soft:");
    expect(cssText).toContain("--accent-soft:");
  });

  it("evolves primary and accent hues within the brand ranges", () => {
    expect(cssText).toContain("--primary: 155 38% 42%");
    expect(cssText).toContain("--accent: 18 78% 58%");
  });

  it("converts pet aliases to var() references instead of values", () => {
    expect(cssText).toContain("--pet-green: var(--primary)");
    expect(cssText).toContain("--pet-green-light: var(--primary-soft)");
    expect(cssText).toContain("--pet-coral: var(--accent)");
    expect(cssText).toContain("--pet-coral-light: var(--accent-soft)");
    expect(cssText).toContain("--pet-cream: var(--background)");
    expect(cssText).toContain("--pet-warm: var(--secondary)");
    expect(cssText).toContain("--pet-text: var(--foreground)");
    expect(cssText).toContain("--pet-text-muted: var(--muted-foreground)");
  });

  it("keeps the .dark --primary and --accent values unchanged", () => {
    expect(cssText).toContain("--primary: 160 40% 50%");
    expect(cssText).toContain("--accent: 15 80% 55%");
  });

  it("adds dark-contrast success/warning/soft keys inside .dark", () => {
    expect(cssText).toContain("--primary-soft: 160 30% 20%");
    expect(cssText).toContain("--accent-soft: 15 60% 20%");
    expect(cssText).toContain("--success: 150 55% 45%");
    expect(cssText).toContain("--warning: 35 85% 62%");
  });

  it("includes the reduced-motion guard and scroll-reveal rules", () => {
    expect(cssText).toContain("@media (prefers-reduced-motion: reduce)");
    expect(cssText).toContain("animation-iteration-count: 1");
    expect(cssText).toContain("[data-reveal]");
    expect(cssText).toContain("[data-reveal][data-revealed]");
  });
});