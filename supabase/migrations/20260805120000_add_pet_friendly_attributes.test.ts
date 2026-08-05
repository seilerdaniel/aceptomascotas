import { readFileSync } from "node:fs";
import { join } from "node:path";

// Migration guard (spec S5): the migration must drop get_agency_properties
// BEFORE the view, recreate the view with the new columns, re-apply grants,
// and recreate the function afterwards — otherwise the agency storefront
// breaks after the view change.

// Vitest runs from the project root, so process.cwd() is the repo root.
const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260805120000_add_pet_friendly_attributes.sql"
);
const migration = readFileSync(migrationPath, "utf-8");

describe("add_pet_friendly_attributes migration guard (S5)", () => {
  it("creates the pet_size enum before touching the properties table", () => {
    expect(migration).toMatch(/CREATE TYPE public\.pet_size AS ENUM/);
    expect(migration.indexOf("CREATE TYPE")).toBeLessThan(
      migration.indexOf("ALTER TABLE")
    );
  });

  it("adds the four pet-friendly columns with validation", () => {
    expect(migration).toMatch(
      /ADD COLUMN IF NOT EXISTS pet_fee NUMERIC CHECK \(pet_fee >= 0\)/
    );
    expect(migration).toMatch(
      /ADD COLUMN IF NOT EXISTS max_pets INT CHECK \(max_pets >= 0\)/
    );
    expect(migration).toMatch(
      /ADD COLUMN IF NOT EXISTS pet_size public\.pet_size/
    );
    expect(migration).toMatch(
      /ADD COLUMN IF NOT EXISTS amenities TEXT\[\] NOT NULL DEFAULT '\{\}'/
    );
  });

  it("drops get_agency_properties BEFORE dropping the view", () => {
    const dropFunction = migration.indexOf("DROP FUNCTION");
    const dropView = migration.indexOf("DROP VIEW");
    const createView = migration.indexOf("CREATE VIEW");
    expect(dropFunction).toBeGreaterThan(-1);
    expect(dropFunction).toBeLessThan(dropView);
    expect(dropView).toBeLessThan(createView);
  });

  it("recreates the view with security_invoker off, the new columns, contact masking and conditional agency_id", () => {
    const viewStart = migration.indexOf("CREATE VIEW");
    const viewSql = migration.slice(viewStart);
    expect(migration).toMatch(
      /CREATE VIEW public\.properties_public\s+WITH \(security_invoker = off\)/
    );
    for (const column of ["pet_fee", "max_pets", "pet_size", "amenities"]) {
      expect(viewSql).toContain(column);
    }
    expect(viewSql).toMatch(
      /CASE WHEN auth\.uid\(\) IS NOT NULL THEN contact_phone ELSE NULL END AS contact_phone/
    );
    expect(viewSql).toMatch(
      /CASE WHEN owner_is_agency THEN user_id ELSE NULL END AS agency_id/
    );
  });

  it("re-applies grants and recreates the agency function after the view", () => {
    const createView = migration.indexOf("CREATE VIEW");
    const grantView = migration.indexOf("GRANT SELECT");
    const createFunction = migration.indexOf(
      "CREATE OR REPLACE FUNCTION public.get_agency_properties"
    );
    const grantFunction = migration.indexOf(
      "GRANT EXECUTE ON FUNCTION public.get_agency_properties"
    );
    expect(grantView).toBeGreaterThan(createView);
    expect(createFunction).toBeGreaterThan(createView);
    expect(grantFunction).toBeGreaterThan(createFunction);
  });
});
