import { readFileSync } from "node:fs";
import { join } from "node:path";

// Text guard for the Fase 3 Freemium migration (spec R1, R2, R3, R4.2, R9, R17).
//
// WHAT THIS GUARD PROVES: presence and ordering. Nothing else.
//
// WHAT THIS GUARD NEVER PROVES, AND MUST NEVER BE REPORTED AS PROVING:
// any database behavior. No test in this repository reaches a database — there
// is no local Postgres, no DB harness, and Docker is unavailable on this
// machine. So the following are DEPLOYED-DATABASE-ONLY and cannot be recorded
// PASS on the strength of this file, `tsc`, a unit test, or code reading:
//   R5, R6, R7, R11, R14, R18
//   plus the behavior halves of R4.1, R8, R9, R10, R12, R13, R15, R16, R19,
//   R22.1, R22.2, R24.2.
// Their only acceptable evidence is an observed database outcome. A green run
// of this file against any of those requirements is a false green.
//
// Concretely: the assertion that count_active_properties() is SECURITY DEFINER
// proves the clause is present in the text. It proves nothing about whether the
// function is reachable by `anon` (R4 Scenario 4.1). Similarly, the assertion
// that get_property_limit() declares 3 proves a literal is present in the text.
// It does not prove the database enforces 3 (R2 Scenario 2.1; the enforcement
// half is R5 Scenario 5.1 and R9 Scenario 9.1, both deployed-only).

// Vitest runs from the project root, so process.cwd() is the repo root.
// The timestamp is fixed BEFORE this guard is authored, because the guard
// hardcodes the filename. It sorts after 20260805120000_add_pet_friendly_attributes.sql,
// the latest migration in supabase/migrations/.
const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20261002120000_add_property_plans.sql"
);
const migration = readFileSync(migrationPath, "utf-8");

/**
 * Slices one `CREATE OR REPLACE FUNCTION public.<name>(...) ... $$;` block out
 * of the migration, so an assertion can be scoped to the function it is about
 * instead of to whatever prose happens to surround it.
 */
function functionBlock(name: string): string {
  const start = migration.indexOf(`CREATE OR REPLACE FUNCTION public.${name}`);
  expect(start).toBeGreaterThan(-1);
  const end = migration.indexOf("$$;", start);
  expect(end).toBeGreaterThan(start);
  return migration.slice(start, end);
}

function matchCount(pattern: RegExp): number {
  return migration.match(pattern)?.length ?? 0;
}

describe("add_property_plans migration guard — schema and plan resolvers (T1.1)", () => {
  it("creates the plan_tier enum before adding columns to profiles", () => {
    // R1. The ordering matters: the column below is typed with the enum, so the
    // type has to exist first.
    expect(migration).toMatch(/CREATE TYPE public\.plan_tier AS ENUM/);
    expect(migration).toMatch(/'gratis',\s*\n?\s*'pro'/);

    const createType = migration.indexOf("CREATE TYPE");
    const alterTable = migration.indexOf("ALTER TABLE");
    expect(createType).toBeGreaterThan(-1);
    expect(alterTable).toBeGreaterThan(-1);
    expect(createType).toBeLessThan(alterTable);
  });

  it("adds plan NOT NULL DEFAULT 'gratis' and a nullable plan_expires_at", () => {
    // R1 Scenario 1.1. The DEFAULT is what puts every pre-existing account on
    // the free tier with no backfill — this text guard settles the migration's
    // shape, not that the rows came out right.
    expect(migration).toMatch(
      /ADD COLUMN IF NOT EXISTS plan public\.plan_tier NOT NULL DEFAULT 'gratis'/
    );
    expect(migration).toMatch(
      /ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ(?! NOT NULL)/
    );
  });

  it("creates no table, so no organization model appears", () => {
    // R1 Scenario 1.2. A quota is per person, not per agency.
    expect(migration).not.toMatch(/CREATE TABLE/i);
    expect(migration).not.toMatch(/\b(agencias|agency_members)\b/i);
  });

  it("indexes properties on (user_id) with a predicate restricting to active rows", () => {
    // R3 Scenario 3.1. properties had no indexes at all, so the per-insert
    // count would otherwise be a sequential scan on the hottest write path.
    expect(migration).toMatch(/CREATE INDEX IF NOT EXISTS idx_properties_user_active/);
    expect(migration).toMatch(
      /ON public\.properties \(user_id\) WHERE is_active = true/
    );
  });

  it("keeps the index single-column rather than composite", () => {
    // R3 Scenario 3.1 states a (user_id) predicate. A composite carrying
    // created_at would not match it and would add write cost on the hottest
    // path to remove one sort over a bounded row set.
    expect(migration).not.toMatch(/\(user_id,\s*created_at/);
    expect(migration).not.toMatch(/\(user_id\s*,\s*id/);
  });

  it("revokes EXECUTE from PUBLIC on every function it creates, and grants named", () => {
    // R4 Scenario 4.2 — the TEXT half only. Postgres grants EXECUTE to PUBLIC by
    // default on every new function; 20260719130000 exists purely because
    // revoking from a named role is a no-op while PUBLIC still holds the grant.
    // Scenario 4.1 (role anon is actually refused) is deployed-only: the
    // presence of a REVOKE line is not evidence of the privilege outcome.
    const created = matchCount(/CREATE OR REPLACE FUNCTION public\./g);
    const revoked = matchCount(
      /REVOKE EXECUTE ON FUNCTION public\.[a-z_]+\([^\n]*?\) FROM PUBLIC;/g
    );
    const granted = matchCount(/GRANT\s+EXECUTE ON FUNCTION public\./g);

    expect(created).toBe(4);
    expect(revoked).toBe(created);
    expect(granted).toBe(created);
  });

  it("declares 3 as the gratis limit and NULL as the pro sentinel", () => {
    // R2 Scenarios 2.1 and 2.2. NULL is the single unlimited sentinel: never
    // compared with <, never coerced to a large number. This asserts the SQL
    // copy of the number exists in the text. It does NOT assert that 3 is the
    // correct product limit, nor that the database enforces it.
    const block = functionBlock("get_property_limit");
    expect(block).toMatch(
      /WHEN 'gratis'::public\.plan_tier\s+THEN 3\b/
    );
    expect(block).toMatch(
      /WHEN 'pro'::public\.plan_tier\s+THEN NULL/
    );
    // No other numeric limit may exist in the single plan -> limit map.
    const numericLimits = block.match(/THEN\s+\d+/g) ?? [];
    expect(numericLimits).toEqual(["THEN 3"]);
  });

  it("resolves the effective plan from VALUES, not from a user id", () => {
    // R14 / defect #31. A BEFORE UPDATE row trigger on public.profiles runs
    // before the row is written, so a resolver that re-reads public.profiles
    // sees the OLD value — the pro -> gratis downgrade resolves unlimited and
    // the deactivation never runs. resolve_effective_plan therefore takes the
    // two values and is STABLE (now() is STABLE, not IMMUTABLE).
    const block = functionBlock("resolve_effective_plan");
    expect(block).toMatch(
      /resolve_effective_plan\(\s*p_plan\s+public\.plan_tier,\s*p_expires_at\s+TIMESTAMPTZ\s*\)/
    );
    expect(block).toMatch(/RETURNS public\.plan_tier/);
    expect(block).toMatch(/STABLE/);
    expect(block).not.toMatch(/FROM public\.profiles/);
    expect(block).not.toMatch(/p_user_id/);
  });

  it("exposes get_effective_plan only as a thin SECURITY DEFINER wrapper", () => {
    // The wrapper reads profiles exactly once and delegates to the value-based
    // resolver. It exists only for the places where reading profiles IS correct
    // (the properties INSERT policy and BEFORE INSERT trigger, where the
    // reacting row is properties and does not exist yet).
    const block = functionBlock("get_effective_plan");
    expect(block).toMatch(/get_effective_plan\(p_user_id UUID\)/);
    expect(block).toMatch(/SECURITY DEFINER/);
    expect(block).toMatch(/SET search_path = public/);
    expect(block).toMatch(/public\.resolve_effective_plan\(p\.plan, p\.plan_expires_at\)/);
  });

  it("counts only is_active = true, and never the predicate that admits NULL", () => {
    // R9 Scenario 9.2. properties.is_active is boolean | null. Rows with NULL
    // are already invisible to the public read path (properties_public filters
    // on is_active = true), so charging them quota would penalise listings the
    // owner cannot see. The whole-file form of this assertion also catches the
    // predicate reappearing in a policy added later.
    const block = functionBlock("count_active_properties");
    expect(block).toMatch(
      /WHERE user_id = p_user_id AND is_active = true/
    );
    expect(migration).not.toMatch(/IS\s+NOT\s+FALSE/i);
  });

  it("makes count_active_properties SECURITY DEFINER with a pinned search_path", () => {
    // SECURITY DEFINER is mandatory, not stylistic: the SELECT policy on
    // properties was intentionally dropped (20260623003622), so the count
    // cannot read the table under the caller's privileges.
    const block = functionBlock("count_active_properties");
    expect(block).toMatch(/SECURITY DEFINER/);
    expect(block).toMatch(/SET search_path = public/);
    expect(block).toMatch(/RETURNS INTEGER/);
  });

  it("does not drop or recreate properties_public", () => {
    // R17 Scenario 17.1. This is a claim about ABSENCE of text, which is the
    // one DB-adjacent requirement a text guard genuinely settles.
    expect(migration).not.toMatch(/DROP\s+VIEW/i);
    expect(migration).not.toMatch(/CREATE\s+VIEW/i);
    expect(migration).not.toMatch(/properties_public/);
  });
});

// PENDING: cross-file drift assertions — NOT APPLICABLE YET.
//
// Two assertions this guard will eventually own must compare the SQL against
// the pure TypeScript mirror in src/data/plans.ts:
//   1. the SQL get_property_limit() gratis literal equals PLAN_LIMITS.gratis  (R2 Scenario 2.3)
//   2. the SQL RAISE text equals buildQuotaMessage(limit)                    (R6, defect #31)
//
// src/data/plans.ts does not exist until PR 2 (task T2.1). readFileSync on a
// missing file throws at module load, which would take down the entire vitest
// run and take every SQL-internal assertion above with it. That is Finding T-1,
// and it is why these two are isolated here instead of being written inline.
//
// They are declared `todo` rather than guarded by a conditional or a
// try/catch. A guard that silently passes when a file is missing is a
// false-green generator — the exact failure mode R-V exists to prevent. A `todo`
// is visible in the run output as work not done, and it cannot be flipped to
// passing without an author editing this block on purpose.
//
// T2.2 REPLACES this block with the two real assertions; that is the first
// moment both files exist. Do not un-skip these before src/data/plans.ts ships.
// When they land they prove the two copies are EQUAL — never that either is
// semantically correct, and never that the database enforces the limit.
describe.todo(
  "PENDING: cross-file drift assertions — src/data/plans.ts ships in PR 2 (T2.1)",
  () => {
    // Each deferred assertion is named separately so T2.2 reads as a
    // substitution of two known items rather than a rewrite of an opaque block.
    // Bodies are comments, not code: importing a module that does not exist
    // yet would break module resolution for this whole file, which is the
    // exact failure mode this block exists to avoid.

    it("the SQL get_property_limit gratis literal equals PLAN_LIMITS.gratis", () => {
      // R2 Scenario 2.3 / R20 Scenario 20.3. T2.2 body:
      //   import { PLAN_LIMITS } from "../../src/data/plans";
      //   expect(limitLiteralIn(functionBlock("get_property_limit")))
      //     .toBe(PLAN_LIMITS.gratis);
    });

    it("the SQL quota RAISE text equals buildQuotaMessage(limit)", () => {
      // R6, defect #31. T2.2 body:
      //   import { buildQuotaMessage } from "../../src/data/plans";
      //   expect(raiseTextIn(migration)).toBe(buildQuotaMessage(3));
      // The space in "seguir publicando" is part of the requirement, so this
      // comparison is character-for-character, not a substring match.
    });
  }
);
