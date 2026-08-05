import { readFileSync } from "node:fs";
import { join } from "node:path";

// Migration guard (spec S10/S11/S17): property_reviews must keep direct
// INSERT revoked from anon/authenticated (S11) so every insert goes through
// submit-review, the property_ratings view must bake `is_approved = true`
// into its definition (S10), and the review-images bucket must use the
// folder-per-user policy pattern (S17).

// Vitest runs from the project root, so process.cwd() is the repo root.
const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260805130000_add_property_reviews.sql"
);
const migration = readFileSync(migrationPath, "utf-8");

describe("add_property_reviews migration guard (S10/S11/S17)", () => {
  it("creates the property_reviews table with the hardened column contract", () => {
    expect(migration).toMatch(
      /CREATE TABLE public\.property_reviews/
    );
    expect(migration).toMatch(
      /property_id UUID NOT NULL REFERENCES public\.properties\(id\) ON DELETE CASCADE/
    );
    expect(migration).toMatch(
      /user_name TEXT NOT NULL CHECK \(char_length\(user_name\) BETWEEN 1 AND 100\)/
    );
    expect(migration).toMatch(
      /rating INTEGER NOT NULL CHECK \(rating BETWEEN 1 AND 5\)/
    );
    expect(migration).toMatch(
      /comment TEXT CHECK \(char_length\(comment\) <= 500\)/
    );
    expect(migration).toMatch(
      /user_id UUID REFERENCES auth\.users\(id\) ON DELETE SET NULL/
    );
    expect(migration).toMatch(
      /is_approved BOOLEAN NOT NULL DEFAULT false/
    );
    expect(migration).toMatch(/pet_dimensions JSONB/);
  });

  it("adds both indexes (property feed + user feed)", () => {
    expect(migration).toMatch(
      /idx_property_reviews_property_approved_created\s+ON public\.property_reviews \(property_id, is_approved, created_at DESC\)/
    );
    expect(migration).toMatch(
      /idx_property_reviews_user_created\s+ON public\.property_reviews \(user_id, created_at\)/
    );
  });

  it("enables RLS and revokes direct INSERT from anon and authenticated (S11)", () => {
    expect(migration).toMatch(
      /ALTER TABLE public\.property_reviews ENABLE ROW LEVEL SECURITY/
    );
    const revokeIndex = migration.indexOf("REVOKE INSERT");
    const createIndex = migration.indexOf("CREATE TABLE public.property_reviews");
    expect(revokeIndex).toBeGreaterThan(-1);
    expect(revokeIndex).toBeGreaterThan(createIndex);
    expect(migration).toMatch(
      /REVOKE INSERT ON public\.property_reviews FROM anon, authenticated/
    );
  });

  it("gates SELECT to approved-or-admin-or-owner and UPDATE to owner with admin override (S15)", () => {
    const selectPolicy = migration.indexOf("Approved property reviews are viewable by everyone");
    expect(selectPolicy).toBeGreaterThan(-1);
    expect(migration).toMatch(
      /USING \(is_approved = true OR public\.has_role\(auth\.uid\(\), 'admin'\) OR auth\.uid\(\) = user_id\)/
    );
    expect(migration).toMatch(
      /CREATE POLICY "Users can update their own property reviews"/
    );
    expect(migration).toMatch(
      /CREATE POLICY "Admins can update all property reviews"/
    );
    expect(migration).toMatch(
      /CREATE POLICY "Admins can delete all property reviews"/
    );
  });

  it("attaches a SECOND protect_review_admin_fields trigger without touching service_reviews (S15)", () => {
    const propertyTrigger = migration.indexOf(
      "protect_property_review_admin_fields_trigger"
    );
    expect(propertyTrigger).toBeGreaterThan(-1);
    expect(migration).toMatch(
      /EXECUTE FUNCTION public\.protect_review_admin_fields\(\);/
    );
    // The migration must not redefine the function nor drop the service trigger.
    expect(migration).not.toMatch(/CREATE OR REPLACE FUNCTION public\.protect_review_admin_fields/);
    expect(migration).not.toMatch(/protect_review_admin_fields_trigger ON public\.service_reviews/);
  });

  it("creates property_ratings with security_invoker off and is_approved=true baked in (S10)", () => {
    const viewStart = migration.indexOf("CREATE OR REPLACE VIEW public.property_ratings");
    const viewSql = migration.slice(viewStart);
    expect(migration).toMatch(
      /CREATE OR REPLACE VIEW public\.property_ratings\s+WITH \(security_invoker = off\)/
    );
    expect(viewSql).toMatch(/WHERE is_approved = true/);
    expect(viewSql).toMatch(/COUNT\(\*\) AS review_count/);
    expect(viewSql).toMatch(/AVG\(rating\)/);
    expect(migration).toMatch(/GRANT SELECT ON public\.property_ratings TO anon, authenticated/);
  });

  it("creates the review-images bucket with folder-per-user RLS policies (S17)", () => {
    expect(migration).toMatch(
      /INSERT INTO storage\.buckets \(id, name, public\)\s+VALUES \('review-images', 'review-images', true\)/
    );
    for (const policy of [
      "Users can upload review images",
      "Users can update their review images",
      "Users can delete their review images",
      "Review images are publicly accessible",
    ]) {
      expect(migration).toContain(policy);
    }
    const insertPolicy = migration.indexOf("Users can upload review images");
    expect(migration.slice(insertPolicy)).toMatch(
      /\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/
    );
  });
});
