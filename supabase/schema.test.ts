import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// These tests treat schema.sql as TEXT and assert structural expectations.
// There is no live database to run against, so this guards against accidental
// schema regressions (renamed columns, dropped constraints, weakened RLS, etc.)
// and keeps the SQL in lock-step with lib/types.ts.

const SCHEMA_PATH = join(dirname(fileURLToPath(import.meta.url)), "schema.sql");

let sql = "";
// Whitespace-collapsed, lower-cased view for forgiving substring/regex checks.
let normalized = "";

beforeAll(() => {
  sql = readFileSync(SCHEMA_PATH, "utf8");
  normalized = sql.replace(/\s+/g, " ").toLowerCase();
});

describe("schema.sql — file sanity", () => {
  it("is a non-empty SQL file", () => {
    expect(sql.length).toBeGreaterThan(0);
    expect(sql).toContain("create table");
  });
});

describe("schema.sql — table definition", () => {
  it("creates the public.records table idempotently", () => {
    expect(normalized).toContain(
      "create table if not exists public.records",
    );
  });

  it("does not define any unexpected tables", () => {
    const tableMatches = normalized.match(/create table[^(]*?(\w+\.\w+|\w+)\s*\(/g) ?? [];
    expect(tableMatches).toHaveLength(1);
  });
});

describe("schema.sql — columns", () => {
  // Each column the app's Record type (lib/types.ts) depends on must exist.
  const expectedColumns: Array<[string, RegExp]> = [
    ["id", /id\s+uuid\b/],
    ["artist", /artist\s+text\b/],
    ["title", /title\s+text\b/],
    ["year", /year\s+integer\b/],
    ["genre", /genre\s+text\b/],
    ["rating", /rating\s+numeric\b/],
    ["notes", /notes\s+text\b/],
    ["cover_url", /cover_url\s+text\b/],
    ["purchase_price", /purchase_price\s+numeric\b/],
    ["purchase_date", /purchase_date\s+date\b/],
    ["condition", /condition\s+text\b/],
    ["created_at", /created_at\s+timestamptz\b/],
  ];

  it.each(expectedColumns)("declares column %s with the expected type", (_name, re) => {
    expect(normalized).toMatch(re);
  });

  it("declares all 12 columns the Record type expects", () => {
    // Every column lib/types.ts depends on must be present with its type.
    const present = expectedColumns.filter(([, re]) => re.test(normalized));
    expect(present).toHaveLength(12);
  });

  it("declares EXACTLY 12 columns — no extra (13th) column", () => {
    // The presence check above can't notice an *added* column. Parse the actual
    // column list out of the `create table ( ... )` body and count top-level
    // declarations, so a 13th column (which would break the 1:1 mapping with
    // lib/types.ts Record) makes this fail.
    const body = sql.match(/create table[^(]*\(([\s\S]*)\);/i)?.[1] ?? "";
    expect(body).not.toBe("");

    // Strip line comments (-- ...) so commented prose isn't counted.
    const withoutComments = body
      .split("\n")
      .map((line) => line.replace(/--.*$/, ""))
      .join("\n");

    // Split on top-level commas only (depth 0); commas inside check(...) such as
    // `condition in ('mint','vg+','vg','g')` are nested and must not split.
    const decls: string[] = [];
    let depth = 0;
    let current = "";
    for (const ch of withoutComments) {
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      if (ch === "," && depth === 0) {
        decls.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    decls.push(current);

    // A column declaration starts with an identifier; this table has no
    // table-level constraints (primary key / check are inline), so every
    // non-blank top-level item is a column.
    const columnNames = decls
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => d.split(/\s+/)[0]);

    expect(columnNames).toEqual([
      "id",
      "artist",
      "title",
      "year",
      "genre",
      "rating",
      "notes",
      "cover_url",
      "purchase_price",
      "purchase_date",
      "condition",
      "created_at",
    ]);
  });
});

describe("schema.sql — keys and defaults", () => {
  it("makes id the primary key with a gen_random_uuid() default", () => {
    expect(normalized).toMatch(/id\s+uuid\s+primary\s+key\s+default\s+gen_random_uuid\(\)/);
  });

  it("marks artist and title NOT NULL", () => {
    expect(normalized).toMatch(/artist\s+text\s+not\s+null/);
    expect(normalized).toMatch(/title\s+text\s+not\s+null/);
  });

  it("defaults genre to 'other' and marks it NOT NULL", () => {
    expect(normalized).toMatch(/genre\s+text\s+not\s+null\s+default\s+'other'/);
  });

  it("defaults created_at to now() and marks it NOT NULL", () => {
    expect(normalized).toMatch(/created_at\s+timestamptz\s+not\s+null\s+default\s+now\(\)/);
  });
});

describe("schema.sql — check constraints", () => {
  it("constrains rating to 0.5..5 in half-star steps", () => {
    expect(normalized).toMatch(
      /rating\s+numeric\s+check\s*\(\s*rating\s+between\s+0\.5\s+and\s+5\s+and\s+mod\s*\(\s*rating\s*\*\s*2\s*,\s*1\s*\)\s*=\s*0\s*\)/,
    );
  });

  it("constrains condition to the four allowed grades", () => {
    expect(normalized).toMatch(
      /condition\s+text\s+check\s*\(\s*condition\s+in\s*\(\s*'mint'\s*,\s*'vg\+'\s*,\s*'vg'\s*,\s*'g'\s*\)\s*\)/,
    );
  });

  it("lists exactly the condition values used by the Condition type in lib/types.ts", () => {
    const conditionClause =
      normalized.match(/condition\s+in\s*\(([^)]*)\)/)?.[1] ?? "";
    const values = conditionClause
      .split(",")
      .map((v) => v.trim().replace(/'/g, ""))
      .filter(Boolean);
    expect(values).toEqual(["mint", "vg+", "vg", "g"]);
  });
});

describe("schema.sql — Row Level Security", () => {
  it("enables RLS on public.records", () => {
    expect(normalized).toContain(
      "alter table public.records enable row level security",
    );
  });

  it("grants public SELECT to everyone via using (true)", () => {
    expect(normalized).toMatch(
      /create\s+policy\s+"public records are viewable by everyone"\s+on\s+public\.records\s+for\s+select\s+using\s*\(\s*true\s*\)/,
    );
  });

  it("declares owner-only INSERT, UPDATE, and DELETE policies", () => {
    for (const action of ["insert", "update", "delete"] as const) {
      expect(normalized).toMatch(
        new RegExp(`create\\s+policy\\s+"owner can ${action} records"\\s+on\\s+public\\.records\\s+for\\s+${action}`),
      );
    }
  });

  it("restricts write policies to the authenticated role", () => {
    // Three write policies (insert/update/delete) each target `to authenticated`.
    const matches = normalized.match(/for\s+(insert|update|delete)\s+to\s+authenticated/g) ?? [];
    expect(matches).toHaveLength(3);
  });

  it("gates writes on the owner's JWT email claim", () => {
    expect(normalized).toContain(
      "auth.jwt() ->> 'email' = 'hijun2952@gmail.com'",
    );
    // The owner email is referenced once per write check: insert with-check,
    // update using + with-check, delete using = 4 occurrences total.
    const occurrences = normalized.split("auth.jwt() ->> 'email' = 'hijun2952@gmail.com'").length - 1;
    expect(occurrences).toBe(4);
  });

  it("uses with check on insert and using on delete", () => {
    expect(normalized).toMatch(/for\s+insert\s+to\s+authenticated\s+with\s+check\s*\(/);
    expect(normalized).toMatch(/for\s+delete\s+to\s+authenticated\s+using\s*\(/);
  });
});
