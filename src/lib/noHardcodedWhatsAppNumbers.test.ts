import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Spec S22 — zero hardcoded/fake wa.me numbers: every entry point must
// build links through src/lib/whatsapp.ts and read the business number
// from src/config. Only src/config/index.ts may hold the number (as a
// bare phone string, never as a wa.me literal). Test files are excluded:
// they intentionally assert built URLs, including the config number.

const REPO_ROOT = process.cwd();
const ALLOWED_FILE = join(REPO_ROOT, "src", "config", "index.ts");
const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", ".vite", "coverage"]);
const TEST_FILE = /\.(test|spec)\.(ts|tsx|js|jsx)$/;
const HARDCODED_WA_ME = /wa\.me\/54\d+/;

const walk = (dir: string, files: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
};

describe("no hardcoded wa.me numbers (S22)", () => {
  it("allows wa.me numbers only in src/config", () => {
    const offenders = walk(REPO_ROOT)
      .filter((file) => file !== ALLOWED_FILE && !TEST_FILE.test(file))
      .filter((file) => HARDCODED_WA_ME.test(readFileSync(file, "utf-8")));

    expect(offenders).toEqual([]);
  });
});
