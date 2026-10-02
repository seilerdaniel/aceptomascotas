-- ============================================================================
-- Fase 3 Freemium — per-person plan with an enforced active-listing quota
-- ============================================================================
--
-- WHAT THIS MIGRATION IS, IN ONE LINE: it gives every person a plan on their
-- own profile row and caps simultaneously active property listings at 3 on the
-- free tier, with no cap on the paid tier.
--
-- 1. The plan lives on public.profiles, on the person's own row. No agency
--    table and no membership relation are introduced: a quota is per person,
--    so three members of one agency get three quotas and three storefronts.
-- 2. The limit is applied on the properties write path by TWO mechanisms: an
--    RLS policy (WITH CHECK) and a BEFORE INSERT trigger. Both are required —
--    see sections 7 and 8.
-- 3. A BEFORE UPDATE trigger on public.profiles pauses the excess when the
--    effective plan becomes one with a finite limit.
-- 4. That SAME trigger also stops a non-admin from granting themselves a plan.
--    Without it, anyone holding a JWT writes plan = 'pro' on their own row in
--    a single request, because the profiles UPDATE policy is
--    USING (auth.uid() = user_id) and no migration narrows it.
--
-- WHAT THIS FILE DOES NOT PROVE — binding, and not negotiable by a green CI run:
--
--   No test in this repository reaches a database. There is no local Postgres
--   and no DB harness; the Supabase CLI is installed but Docker is unavailable
--   on this machine. The text guard that ships beside this file,
--   20261002120000_add_property_plans.test.ts, proves PRESENCE and ORDERING
--   only. It never proves behavior.
--
--   So the following are DEPLOYED-DATABASE-ONLY and MUST NOT be recorded as
--   PASS on the strength of this file, its text guard, `tsc`, a unit test, or
--   code reading. Their only acceptable evidence is an observed database
--   outcome:
--     R5, R6, R7, R11, R14, R18
--     plus the behavior halves of R4.1, R8, R9, R10, R12, R13, R15, R16, R19,
--     R22.1, R22.2 and R24.2.
--
--   One concrete example, because it is the easiest to get wrong: R4 Scenario
--   4.1 requires role anon to be refused on the counting helper. The presence
--   of a revoke line below is NOT that evidence. A revoke's presence is never
--   evidence of the privilege outcome.
--
-- STAGING NOTE: this migration is authored in slices — T1.1 schema and plan
-- resolvers, T1.2 the insert gate (sections 7 and 8), T1.3 plan consistency
-- (sections 9 and 10). With T1.3 the SQL file is complete; the only remaining
-- slice, T1.4, edits generated types only and does not touch this file.
-- ============================================================================

-- 1. Plan enum and the two columns.
--
-- NOT NULL DEFAULT 'gratis' is what puts every pre-existing account on the
-- free tier immediately, with no backfill statement. plan_expires_at is
-- nullable on purpose: NULL means "does not expire". Both are added
-- idempotently so the migration can be applied to a database that already has
-- them.
CREATE TYPE public.plan_tier AS ENUM ('gratis', 'pro');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan public.plan_tier NOT NULL DEFAULT 'gratis',
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- 2. properties carried NO index at all — not even on user_id. The count in
-- section 5 runs on every insert, so without this the quota is a sequential
-- scan on the hottest write path in the app.
--
-- The shape is (user_id) WHERE is_active = true on purpose: it answers the
-- hot-path count as an index-only scan. It is deliberately NOT composite.
-- Adding created_at would widen write cost on that same hot path to remove
-- one sort, and it would no longer match the single-column predicate the
-- requirement states. The only ORDER BY in this change (choosing which
-- listings survive a downgrade) runs once per plan change over one account's
-- active rows, where a small sort is irrelevant.
CREATE INDEX IF NOT EXISTS idx_properties_user_active
  ON public.properties (user_id) WHERE is_active = true;

-- 3. The effective plan is resolved from VALUES, never from a user id.
--
-- That is the entire reason this function exists separately from the wrapper in
-- section 6. A BEFORE UPDATE row trigger on public.profiles runs before the
-- row is written, so a resolver that re-read public.profiles returns the OLD
-- value: on a pro -> gratis downgrade it resolves "unlimited", the finite-limit
-- branch is skipped, and the deactivation never runs — the single case the
-- trigger exists for. That defect was invisible because the text was present
-- and every presence guard passed. See section 9.
--
-- now() is STABLE rather than IMMUTABLE, so the function is STABLE too.
-- Expiry is evaluated per call: no scheduled job or sweep is required for an
-- expired plan to stop admitting new listings.
CREATE OR REPLACE FUNCTION public.resolve_effective_plan(
  p_plan       public.plan_tier,
  p_expires_at TIMESTAMPTZ
)
RETURNS public.plan_tier
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN p_plan = 'pro'::public.plan_tier
     AND (p_expires_at IS NULL OR p_expires_at > now())
      THEN 'pro'::public.plan_tier
    ELSE 'gratis'::public.plan_tier
  END;
$$;

-- Postgres grants EXECUTE to PUBLIC on every new function by default. Revoking
-- from a named role is a no-op while PUBLIC still holds the grant — migration
-- 20260719130000 exists entirely because of that, confirmed there with
-- has_function_privilege returning true after a named-role revoke.
REVOKE EXECUTE ON FUNCTION public.resolve_effective_plan(public.plan_tier, TIMESTAMPTZ) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.resolve_effective_plan(public.plan_tier, TIMESTAMPTZ) TO authenticated;

-- 4. The single place where plan -> limit lives. NULL is the unlimited
-- sentinel: never compared with <, never coerced to a large number. When a
-- payment provider eventually arrives, only this body changes — neither the
-- policy, nor the trigger, nor the TypeScript mirror changes signature.
CREATE OR REPLACE FUNCTION public.get_property_limit(p_plan public.plan_tier)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_plan
    WHEN 'gratis'::public.plan_tier THEN 3
    WHEN 'pro'::public.plan_tier    THEN NULL
  END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_property_limit(public.plan_tier) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_property_limit(public.plan_tier) TO authenticated;

-- 5. Counts only is_active = true, the same predicate the public read path
-- uses. Never the negated form that would also admit NULL: the column is
-- nullable, and rows whose is_active is NULL are already invisible to the
-- public read path, so charging them quota would penalise listings their owner
-- cannot even see.
--
-- SECURITY DEFINER is mandatory, not stylistic: the SELECT policy on properties
-- was intentionally dropped in 20260623003622, so under the caller's own
-- privileges this read would return nothing.
CREATE OR REPLACE FUNCTION public.count_active_properties(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int
  FROM public.properties
  WHERE user_id = p_user_id AND is_active = true;
$$;

REVOKE EXECUTE ON FUNCTION public.count_active_properties(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.count_active_properties(UUID) TO authenticated;

-- 6. A thin wrapper: read the profile once, then delegate to section 3. It is
-- used ONLY where reading profiles is the correct thing to do — the properties
-- INSERT policy and the BEFORE INSERT trigger on properties, where the row
-- reacting to the event is a property row that does not exist yet. It must
-- never be used from the profiles trigger itself; that is the defect described
-- in section 3.
CREATE OR REPLACE FUNCTION public.get_effective_plan(p_user_id UUID)
RETURNS public.plan_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT public.resolve_effective_plan(p.plan, p.plan_expires_at)
     FROM public.profiles p
     WHERE p.user_id = p_user_id),
    'gratis'::public.plan_tier
  );
$$;

REVOKE EXECUTE ON FUNCTION public.get_effective_plan(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_effective_plan(UUID) TO authenticated;

-- 7. The properties INSERT policy.
--
-- The policy this replaces (20260108000904_f9fac999:54-55) is
-- WITH CHECK (auth.uid() = user_id) and nothing else. It never had a role gate,
-- so a buscador could insert a property directly through PostgREST — the rule
-- existed only in PublishPage.tsx:463, in the client. This closes that gap and
-- makes RLS agree with the UI. Same EXISTS shape as the pet_services fix at
-- 20260712100000:8-17.
--
-- The DROP is load-bearing, not housekeeping. Permissive policies are OR'ed, not
-- AND'ed, so leaving the old ownership-only policy in place would keep
-- admitting every authenticated caller and would make the role gate below
-- inert. Without this line the whole role gate buys nothing.
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON public.properties;

CREATE POLICY "Publishers within plan quota can insert properties"
ON public.properties FOR INSERT TO authenticated
WITH CHECK (
  -- R8: the row belongs to the caller. This is what rejects a cross-account
  -- user_id and a null one.
  auth.uid() = user_id
  -- R7: role gate, closing the gap described above. The pair is
  -- ('propietario', 'agencia') and is deliberately NOT narrowed to agencies:
  -- PublishPage.tsx:463 admits both, and narrowing would lock out a user type
  -- the publish flow allows.
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.user_type IN ('propietario', 'agencia')
  )
  -- R10: NULL is the unlimited sentinel and the IS NULL test comes first.
  -- Comparing a count against a NULL limit yields NULL, which is not TRUE, so
  -- an unlimited plan would silently reject every insert instead of none.
  AND (
    public.get_property_limit(public.get_effective_plan(auth.uid())) IS NULL
    OR public.count_active_properties(auth.uid())
       < public.get_property_limit(public.get_effective_plan(auth.uid()))
  )
);

-- 8. The readable message.
--
-- A violated WITH CHECK reaches PostgREST as a bare 42501
-- insufficient_privilege, indistinguishable from any other permission error.
-- bulk-create-properties captures rowError.message per row and shows it to the
-- user, so a trigger carrying its own message is what makes the quota legible
-- in the product at all.
--
-- WHY THIS TRIGGER, AND WHY IT CANNOT BE COLLAPSED INTO THE POLICY — Finding
-- D-1. PostgreSQL enforces RLS WITH CHECK expressions for INSERT, UPDATE and
-- MERGE AFTER BEFORE row triggers have fired (PostgreSQL 18, CREATE POLICY).
-- So for an over-quota insert this trigger rejects first, raising P0001 with the
-- Spanish text below, and the policy's quota clause in section 7 never runs. It
-- is an untraveled backstop: present, correct, and not the mechanism the caller
-- ever sees. Do not "simplify" this by making the policy the quota's authority.
--
-- The two mechanisms are not alternatives and neither is the fallback for the
-- other. A buscador, a cross-account user_id and a null user_id have no quota to
-- reject, so this trigger is silent on all three and the policy is genuinely
-- the only gate there. That is why both stay.
CREATE OR REPLACE FUNCTION public.enforce_property_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  v_limit := public.get_property_limit(public.get_effective_plan(NEW.user_id));
  IF v_limit IS NOT NULL
     AND public.count_active_properties(NEW.user_id) >= v_limit THEN
    -- The % interpolates v_limit. The space in "seguir publicando" is part of
    -- the requirement, not a typo.
    RAISE EXCEPTION
      'Alcanzaste tu límite de % publicaciones activas. Desactivá una publicación o actualizá tu plan para seguir publicando.',
      v_limit
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

-- No named grant here: the caller is the trigger, not a client. This is the
-- shape 20260719130000 already applies to the trigger functions it revoked.
REVOKE EXECUTE ON FUNCTION public.enforce_property_quota() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_enforce_property_quota ON public.properties;
CREATE TRIGGER trg_enforce_property_quota
BEFORE INSERT ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.enforce_property_quota();

-- 9. Plan consistency — ONE trigger, two decisions.
--
-- This function does both jobs the profile UPDATE path needs: it refuses a
-- self-service plan change, and it pauses the excess when the effective plan
-- falls to a tier with a finite limit. One function, not two triggers, and the
-- reason is mechanical rather than stylistic.
--
-- PostgreSQL fires triggers that share the same event and timing in
-- ALPHABETICAL ORDER BY NAME, and there is no way to declare it otherwise:
-- FOLLOWS and PRECEDES are MySQL and Oracle syntax and do not exist in the
-- PostgreSQL 18 CREATE TRIGGER grammar. So if the guard and the deactivation
-- were two triggers, the first one's NAME would decide which sees what. The
-- other BEFORE UPDATE triggers on profiles are trg_prevent_self_verification
-- (20260707140512:24) and update_profiles_updated_at (20260108000904:112), so a
-- deactivation trigger sorting before the guard would pause live listings and
-- then let the guard revert NEW.plan — live listings destroyed, plan unchanged,
-- and any check that only reads profiles.plan would report everything fine.
--
-- A single function cannot disagree with itself: it resolves the effective plan
-- once and both decisions read that one resolution.
--
-- And because the guard RAISES instead of reverting silently, a rejected
-- change aborts the statement, so the inner UPDATE public.properties rolls back
-- together with the profile write. That is what makes R12 and R13 structurally
-- true rather than true by naming convention — atomicity is the transaction's,
-- not the author's careful sequencing.
--
-- The trigger is named trg_enforce_plan_consistency so it sorts FIRST
-- (trg_e < trg_p < update_...), which means a rejection happens before
-- trg_prevent_self_verification or update_profiles_updated_at touch anything.
-- That ordering is defense in depth; the real correction is that both decisions
-- live in one function. Do not rename it up into the trg_p..trg_u range on the
-- assumption that its name is what enforces the guard.
CREATE OR REPLACE FUNCTION public.enforce_plan_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_effective public.plan_tier;
  v_new_effective public.plan_tier;
  v_new_limit     INTEGER;
BEGIN
  -- (a) R11 — a plan is changed from an admin surface, not from the account.
  --
  -- Compared BY VALUE, not by column list. A guard conditioned on which columns
  -- appear in the SET list would fire on any UPDATE that names plan at all, so a
  -- form that round-trips the whole row would be refused for a save that changed
  -- nothing. Comparing the two values means a normal profile save that never
  -- touches plan always passes — ProfilePage.tsx:261-269 writes four named
  -- columns today.
  --
  -- It RAISES, and does not revert silently the way prevent_self_verification
  -- does, for two reasons. One: the caller learns its write was refused instead
  -- of receiving success and a toast that lies. Two, and this is the load-bearing
  -- one: a silent revert leaves the statement SUCCEEDING, so any deactivation
  -- already run inside it stays committed. Raising aborts the statement and its
  -- transaction, and the inner UPDATE public.properties rolls back with it.
  --
  -- auth.uid() IS NULL is the direct-SQL path (Supabase dashboard, psql)
  -- documented in section 10. It is load-bearing, not a hole: has_role is
  -- SELECT EXISTS over user_roles, so has_role(NULL, 'admin') is false, and
  -- without this clause every grant written down in section 10 would be
  -- silently refused. It is a narrow boolean OR inside the change test and it
  -- stays there — hoisting it into a bypass around the test would also admit any
  -- session that merely happens to carry no uid.
  IF (NEW.plan IS DISTINCT FROM OLD.plan
      OR NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at)
     AND NOT public.has_role(auth.uid(), 'admin')
     AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION
      'No podés cambiar tu plan por tu cuenta. Pedile a un administrador que lo actualice.'
      USING ERRCODE = '42501';
  END IF;

  -- (b) The downgrade reaction.
  --
  -- BOTH limits are derived from OLD and NEW VALUES. There is no SELECT anywhere
  -- in this function body and there must never be one. A BEFORE UPDATE row
  -- trigger runs before the row is written, so re-reading public.profiles
  -- returns OLD.plan: on a pro -> gratis downgrade it resolves "unlimited",
  -- get_property_limit returns NULL, the finite-limit branch below is skipped,
  -- and no listing is ever deactivated. That is the single case the trigger
  -- exists for, and it shipped looking correct because the text was present and
  -- every presence guard passed. Defect #31; R14 names this shape as a
  -- requirement failure regardless of what the text says.
  --
  -- The condition is "the RESOLVED EFFECTIVE PLAN changed", not "the plan column
  -- changed", and that is what makes the three hard cases converge:
  --   - an admin setting plan_expires_at into the past resolves NEW as gratis,
  --     so the expiry-driven downgrade pauses the excess too (R14 Scenario 14.2);
  --   - a repeated downgrade resolves NEW exactly as the first one did, so the
  --     branch finds no work and the downgrade is idempotent (Scenario 14.6);
  --   - an update to an unrelated column resolves NEW the same as OLD, so
  --     nothing is paused (R12 Scenario 12.2).
  v_old_effective := public.resolve_effective_plan(OLD.plan, OLD.plan_expires_at);
  v_new_effective := public.resolve_effective_plan(NEW.plan, NEW.plan_expires_at);

  IF v_new_effective IS DISTINCT FROM v_old_effective THEN
    v_new_limit := public.get_property_limit(v_new_effective);
    -- The IS NULL test comes first and is not optional. NULL is the unlimited
    -- sentinel: an upgrade to pro resolves it, and an unlimited plan must pause
    -- nothing.
    IF v_new_limit IS NOT NULL THEN
      -- Pauses, never deletes. R16's restorability holds because the rows, their
      -- content and their images are untouched.
      --
      -- The ordering is TOTAL. created_at is NOT NULL DEFAULT now() and
      -- bulk-create-properties inserts rows in a tight loop, so timestamp ties
      -- are real; id is the uuid PRIMARY KEY, unique and never null. The
      -- id DESC tiebreak carries NO semantic meaning — a v4 uuid has no temporal
      -- order — and exists only so the survivor set is reproducible on an
      -- equivalent fixture (R15 Scenario 15.2).
      --
      -- The public read view filters on is_active = true, so pausing is what
      -- removes a listing from the search path. The view itself is not touched.
      --
      -- owner_is_agency is deliberately never written here: a plan change never
      -- mutates user_type, and this migration must not trip the
      -- snapshot-vs-live mismatch that the spec defers to its own change.
      UPDATE public.properties
      SET is_active = false
      WHERE id IN (
        SELECT id FROM public.properties
        WHERE user_id = NEW.user_id AND is_active = true
        ORDER BY created_at DESC, id DESC
        OFFSET v_new_limit
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- No named grant, for the same reason and with the same precedent as section 8:
-- the caller is the trigger, not a client. 20260719130000 revokes the four
-- trigger functions it touched from PUBLIC with no replacement grant, and they
-- still fire in production — a trigger does not need EXECUTE from PUBLIC.
--
-- This is deliberately STRICTER than R4's literal wording ("granted explicitly
-- to a named role"), which is a known spec defect recorded in the design: a
-- named grant on a trigger function grants nothing useful and only widens the
-- surface. Do not add a GRANT here to satisfy the wording.
REVOKE EXECUTE ON FUNCTION public.enforce_plan_consistency() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_enforce_plan_consistency ON public.profiles;
CREATE TRIGGER trg_enforce_plan_consistency
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_consistency();

-- 10. The documented plan-grant path.
--
-- R22.4 blesses granting a plan by direct SQL, and these are the statements.
-- They work precisely because of the auth.uid() IS NULL allowance in 9(a): a
-- dashboard or psql session carries no JWT, so auth.uid() is NULL, so
-- has_role(NULL, 'admin') is false and the allowance is the only thing letting
-- them through. Without it the documented grant path would not exist at all and
-- every operator write below would be silently refused.
--
-- The allowance is NOT reachable from PostgREST: role anon has no UPDATE policy
-- on profiles that passes, and a signed JWT always carries sub, so auth.uid()
-- is never NULL for an API caller.
--
--   UPDATE public.profiles SET plan = 'pro' WHERE user_id = '<uuid>';
--   UPDATE public.profiles SET plan = 'pro', plan_expires_at = now() + interval '30 days' WHERE user_id = '<uuid>';
--
-- Either statement may pause listings if it LOWERS the effective plan. That is
-- section 9(b) doing its job, not a side effect to be surprised by; granting a
-- plan never pauses anything.
