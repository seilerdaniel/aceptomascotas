import { readFileSync } from "node:fs";
import { join } from "node:path";

// Text guard for the Fase 3 Freemium migration
// (spec R1, R2, R3, R4.2, R9, R11, R12, R14, R15, R17, R22.4).
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
//
// THE ONE THAT LOOKS BEHAVIORAL AND IS NOT — read this before citing the
// "no FROM public.profiles" assertion. It is the highest-value assertion in this
// file and simultaneously the most dangerous, precisely because it reads like a
// behavioral claim. It is not one. A text guard can only settle a structural
// property of the text, and this settles exactly one: the trigger does not
// consult the table it reacts to. In a BEFORE UPDATE row trigger the stored
// tuple is still OLD, so a re-read resolves the pre-change plan, the
// finite-limit branch is skipped, and no listing is ever deactivated — the one
// case the trigger exists for (defect #31). So the assertion fails loudly if
// someone reintroduces that shape, and it is NEVER evidence for R14's outcome.
// R14's outcome is "a downgrade leaves at most 3 active listings"; only a
// deployed database can settle that.

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

    // Six as of T1.3: the four plan resolvers plus the two trigger functions.
    expect(created).toBe(6);
    // creates === revokes is the meaningful invariant. The absolute number is
    // only a tripwire for an accidental seventh function.
    expect(revoked).toBe(created);
    // Named grants cover the plan resolvers only — four. The two TRIGGER
    // functions are revoked WITHOUT a named grant because their caller is the
    // trigger, not a client, which is the shape 20260719130000 already uses for
    // the four trigger functions it revoked from PUBLIC. R4's "granted to a
    // named role" clause is therefore applied to the resolvers and deliberately
    // NOT to the trigger functions: the deviation runs in the stricter
    // direction, it is a recorded spec defect, and it must not be "fixed" by
    // adding a grant that grants nothing useful.
    expect(granted).toBe(4);
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

// Insert gate: the policy and the quota trigger (T1.2).
//
// These assertions prove that both mechanisms EXIST, and that the policy carries
// the clauses that make it a gate. They prove nothing about what a caller
// observes. Specifically:
//
//   - The trigger EXISTS and the RAISE text is present. They do NOT prove the
//     trigger is what rejects an over-quota insert. That is R5 Scenario 5.2a,
//     deployed-only.
//   - The policy carries ownership, role and quota clauses. They do NOT prove
//     the policy rejects anything, and they do NOT prove the error class a
//     caller sees. That is R5 Scenario 5.2b, deployed-only.
//
// A green run of this block against R5, R6, R7, R8 or R10 is a false green.
describe("add_property_plans migration guard — insert gate (T1.2)", () => {
  it("creates the INSERT policy after the enum and after the helpers it calls", () => {
    // R5 presence half. The ordering is load-bearing, not cosmetic: the policy
    // body calls get_effective_plan, get_property_limit and
    // count_active_properties, so the migration cannot be applied with the
    // policy ahead of them.
    const policy = migration.indexOf(
      'CREATE POLICY "Publishers within plan quota can insert properties"'
    );
    const predecessors = [
      "CREATE TYPE public.plan_tier",
      "CREATE OR REPLACE FUNCTION public.get_effective_plan",
      "CREATE OR REPLACE FUNCTION public.get_property_limit",
      "CREATE OR REPLACE FUNCTION public.count_active_properties",
    ].map((needle) => migration.indexOf(needle));

    expect(policy).toBeGreaterThan(-1);
    expect(predecessors).not.toContain(-1);
    for (const at of predecessors) {
      expect(policy).toBeGreaterThan(at);
    }
  });

  it("drops the previous INSERT policy instead of leaving it beside the new one", () => {
    // Permissive policies are OR'ed, not AND'ed. The policy this one replaces
    // (20260108000904:55) is WITH CHECK (auth.uid() = user_id) with no role
    // gate, so leaving it in place would keep admitting any authenticated
    // caller and would make the new role gate inert. Without this line the
    // whole of R7 stays open.
    expect(migration).toMatch(
      /DROP POLICY IF EXISTS "Authenticated users can insert properties" ON public\.properties/
    );
  });

  it("gates the INSERT policy on ownership, publisher role and a NULL-checked quota", () => {
    // R5 presence half, R7, R8, R10. Same EXISTS shape as the proven
    // pet_services policy at 20260712100000:8-17.
    const start = migration.indexOf(
      'CREATE POLICY "Publishers within plan quota can insert properties"'
    );
    expect(start).toBeGreaterThan(-1);
    const policy = migration.slice(
      start,
      migration.indexOf(
        "CREATE OR REPLACE FUNCTION public.enforce_property_quota"
      )
    );

    expect(policy).toMatch(/FOR INSERT TO authenticated\s+WITH CHECK/);
    // R8 Scenarios 8.1 and 8.2: the row belongs to the caller, so neither a
    // cross-account user_id nor a null one passes.
    expect(policy).toMatch(/auth\.uid\(\) = user_id/);
    // R7. The pair is ('propietario', 'agencia') and is deliberately NOT
    // narrowed to agencies: PublishPage.tsx:463 admits both, and narrowing
    // would lock out a user type the UI allows. Closing drift D4 is exactly
    // this clause — the old policy had no role gate at all.
    expect(policy).toMatch(
      /profiles\.user_type IN \('propietario', 'agencia'\)/
    );

    // R10 Scenario 10.1 / R2 Scenario 2.2. NULL is the unlimited sentinel, and
    // the IS NULL test must come FIRST: comparing a count against a NULL limit
    // yields NULL, which is not TRUE, so an unlimited plan would silently
    // reject every insert instead of none.
    const nullCheckAt = policy.indexOf(
      "public.get_property_limit(public.get_effective_plan(auth.uid())) IS NULL"
    );
    const compareAt = policy.indexOf("< public.get_property_limit(");
    expect(nullCheckAt).toBeGreaterThan(-1);
    expect(compareAt).toBeGreaterThan(nullCheckAt);
  });

  it("creates the quota trigger and raises the Spanish quota message from it", () => {
    // R6 presence half, and R5 Scenario 5.2a's error class in the text.
    //
    // This trigger — not the policy — is the mechanism that fires for an
    // over-quota insert, because PostgreSQL enforces WITH CHECK AFTER BEFORE
    // row triggers (Finding D-1). That ordering is the whole reason the
    // readable message is reachable at all, and it is the reason this
    // mechanism must not be collapsed into a policy-only design.
    expect(migration).toMatch(
      /CREATE TRIGGER trg_enforce_property_quota\s+BEFORE INSERT ON public\.properties\s+FOR EACH ROW EXECUTE FUNCTION public\.enforce_property_quota\(\)/
    );

    const block = functionBlock("enforce_property_quota");
    expect(block).toMatch(/RETURNS TRIGGER/);
    expect(block).toMatch(/SECURITY DEFINER/);
    expect(block).toMatch(/USING ERRCODE = 'P0001'/);

    // R6. The % is the interpolation of the limit through v_limit. The space in
    // "seguir publicando" is part of the requirement, not a typo (defect #31),
    // so this is a containment check on the whole literal rather than a loose
    // match: an empty capture fails it too.
    const message = block.match(/'Alcanzaste tu límite de %[^']*'/)?.[0] ?? "";
    expect(message).toContain("seguir publicando");
  });
});

// Plan consistency: the self-escalation guard and the downgrade reaction (T1.3).
//
// HONESTY FOR THIS WHOLE BLOCK, and it is load-bearing rather than decorative:
// every assertion below is a presence or shape claim. The one that reads as
// behavioral is the "no FROM public.profiles" assertion, and the file header
// already explains why it is not: it proves the trigger does not re-read the
// table it reacts to, and it settles nothing about whether any listing is ever
// paused. A green run of this block is a green run of this block. R11, R12,
// R13, R14, R15, R16 and the behavior half of R22.4 all stay deployed-only.
describe("add_property_plans migration guard — plan consistency (T1.3)", () => {
  it("makes both decisions in ONE function, not two triggers", () => {
    // R12. Two triggers that must agree on the effective plan IS the hazard:
    // PostgreSQL orders same-event same-timing triggers alphabetically by name
    // and offers no FOLLOWS/PRECEDES, so with two triggers the first one's NAME
    // decides which sees what, and a later trigger could revert NEW.plan after
    // live listings were already paused. One function cannot disagree with
    // itself. The name sorts first (trg_e < trg_p < update_...) as defense in
    // depth, so a rejection lands before trg_prevent_self_verification and
    // update_profiles_updated_at touch anything.
    expect(
      matchCount(/CREATE OR REPLACE FUNCTION public\.enforce_plan_[a-z_]+\(/g)
    ).toBe(1);
    expect(matchCount(/CREATE TRIGGER trg_enforce_plan_consistency/g)).toBe(1);
    expect(migration).toMatch(
      /CREATE TRIGGER trg_enforce_plan_consistency\s+BEFORE UPDATE ON public\.profiles\s+FOR EACH ROW EXECUTE FUNCTION public\.enforce_plan_consistency\(\)/
    );
    // The two-trigger sketch named its second trigger this. Its absence is the
    // shape of the hazard the merge removes.
    expect(migration).not.toMatch(/enforce_plan_downgrade/);
  });

  it("derives both limits from OLD and NEW, never from a read of public.profiles", () => {
    // R14, and the regression this whole function exists to avoid.
    //
    // Restating the header's honesty note because this is the assertion most
    // likely to be misread: it is a STRUCTURAL claim about the text, not a
    // behavioral one. What it proves is that no SELECT from public.profiles
    // appears in the body, and that both sides are resolved from values. What it
    // does NOT prove is that any listing is ever paused. That is R14 Scenario
    // 14.1, deployed-only.
    const block = functionBlock("enforce_plan_consistency");
    expect(block).not.toMatch(/FROM public\.profiles/);
    expect(block).toMatch(
      /resolve_effective_plan\(OLD\.plan, OLD\.plan_expires_at\)/
    );
    expect(block).toMatch(
      /resolve_effective_plan\(NEW\.plan, NEW\.plan_expires_at\)/
    );
  });

  it("selects survivors with a TOTAL ordering", () => {
    // R15 Scenarios 15.1 and 15.2. created_at is NOT NULL DEFAULT now() and
    // bulk-create-properties inserts in a tight loop, so timestamp ties are
    // real; id is the uuid PRIMARY KEY, unique and never null, so
    // (created_at DESC, id DESC) is total and the survivor set is reproducible.
    // The id DESC tiebreak carries NO semantic meaning — a v4 uuid has no
    // temporal order — and exists only to be total. Reversing the product
    // preference is one keyword in this one line, because the TypeScript mirror
    // deliberately does not model survivor selection.
    expect(functionBlock("enforce_plan_consistency")).toMatch(
      /ORDER BY created_at DESC, id DESC/
    );
  });

  it("raises 42501 on a self-service plan change, with the direct-SQL allowance inside the test", () => {
    // R11. Two halves, both load-bearing.
    //
    // RAISE, not the silent revert prevent_self_verification performs: a silent
    // revert leaves the statement SUCCEEDING, so a deactivation already run
    // inside it stays committed. Raising aborts the transaction and rolls the
    // inner UPDATE public.properties back with the profile write — that is what
    // makes R12 and R13 structurally true rather than true by naming
    // convention.
    //
    // auth.uid() IS NOT NULL is an ALLOWANCE and belongs inside the change
    // test: has_role is SELECT EXISTS over user_roles, so has_role(NULL,
    // 'admin') is false, and without the allowance every direct-SQL grant
    // documented in section 10 would be silently refused. It is unreachable
    // from PostgREST — anon has no passing UPDATE policy on profiles and a
    // signed JWT always carries sub — and it must stay a narrow boolean OR
    // rather than becoming a bypass around the test.
    const block = functionBlock("enforce_plan_consistency");
    // Compared BY VALUE, not by column list, so a normal profile save that
    // never touches plan always passes (ProfilePage.tsx:261-269 writes four
    // named columns today).
    expect(block).toMatch(
      /NEW\.plan IS DISTINCT FROM OLD\.plan\s+OR NEW\.plan_expires_at IS DISTINCT FROM OLD\.plan_expires_at/
    );
    expect(block).toMatch(/AND NOT public\.has_role\(auth\.uid\(\), 'admin'\)/);
    expect(block).toMatch(/AND auth\.uid\(\) IS NOT NULL THEN/);
    expect(block).toMatch(/USING ERRCODE = '42501'/);
  });

  it("documents the direct-SQL grant path R22.4 blesses", () => {
    // R22.4. These statements are the reason the auth.uid() IS NULL allowance
    // above is coherent: a dashboard or psql session carries no JWT, so the
    // guard has to let it through. A text guard cannot prove the database
    // accepts them — that is R22.1/R22.2, deployed-only. It proves only that
    // the path is written down where an operator will actually find it.
    expect(migration).toMatch(
      /UPDATE public\.profiles SET plan = 'pro' WHERE user_id = '<uuid>';/
    );
    expect(migration).toMatch(
      /UPDATE public\.profiles SET plan = 'pro', plan_expires_at = now\(\) \+ interval '30 days' WHERE user_id = '<uuid>';/
    );
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
