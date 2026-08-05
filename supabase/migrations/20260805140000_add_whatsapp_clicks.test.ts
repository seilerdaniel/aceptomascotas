import { readFileSync } from "node:fs";
import { join } from "node:path";

// Migration guard (spec W3/S24/S25): whatsapp_clicks must be write-only
// for the client (RLS on, no policies), log_whatsapp_click must be
// SECURITY DEFINER reusing check_rate_limit with a silent no-op when
// limited (S25), and be executable by anon + authenticated (S24).

// Vitest runs from the project root, so process.cwd() is the repo root.
const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260805140000_add_whatsapp_clicks.sql"
);
const migration = readFileSync(migrationPath, "utf-8");

describe("add_whatsapp_clicks migration guard (W3/S24/S25)", () => {
  it("creates the whatsapp_clicks table with the click contract", () => {
    expect(migration).toMatch(/CREATE TABLE public\.whatsapp_clicks/);
    expect(migration).toMatch(/source TEXT NOT NULL/);
    expect(migration).toMatch(/property_id UUID REFERENCES public\.properties\(id\)/);
    expect(migration).toMatch(/service_id UUID REFERENCES public\.pet_services\(id\)/);
    expect(migration).toMatch(/referrer TEXT/);
    expect(migration).toMatch(/identifier TEXT/);
    expect(migration).toMatch(/created_at TIMESTAMPTZ NOT NULL DEFAULT now\(\)/);
  });

  it("adds indexes on source and created_at", () => {
    expect(migration).toMatch(
      /idx_whatsapp_clicks_source\s+ON public\.whatsapp_clicks \(source\)/
    );
    expect(migration).toMatch(
      /idx_whatsapp_clicks_created_at\s+ON public\.whatsapp_clicks \(created_at\)/
    );
  });

  it("enables RLS with no client policies (SECURITY DEFINER writes only)", () => {
    expect(migration).toMatch(
      /ALTER TABLE public\.whatsapp_clicks ENABLE ROW LEVEL SECURITY/
    );
    expect(migration).not.toMatch(/CREATE POLICY/);
  });

  it("defines log_whatsapp_click as SECURITY DEFINER reusing check_rate_limit with a silent no-op (S25)", () => {
    expect(migration).toMatch(/CREATE OR REPLACE FUNCTION public\.log_whatsapp_click/);
    expect(migration).toMatch(/SECURITY DEFINER/);
    expect(migration).toMatch(/check_rate_limit\(p_identifier, 'whatsapp_click', 10, 60\)/);
    // Limited => return without inserting, never raising (S25).
    const fnStart = migration.indexOf("CREATE OR REPLACE FUNCTION public.log_whatsapp_click");
    expect(migration.slice(fnStart)).toMatch(/IF NOT public\.check_rate_limit[\s\S]*THEN\s+RETURN;/);
  });

  it("grants EXECUTE to anon and authenticated", () => {
    expect(migration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.log_whatsapp_click\(TEXT, TEXT, TEXT, UUID, UUID\) TO anon, authenticated/
    );
  });
});
