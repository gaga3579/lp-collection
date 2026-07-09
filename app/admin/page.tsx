"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import Nav from "@/components/Nav";
import RecordForm from "@/components/admin/RecordForm";
import StarRating from "@/components/StarRating";
import { createClient } from "@/lib/supabase/client";
import type { Record, RecordInput } from "@/lib/types";

const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL;

export default function AdminPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [editing, setEditing] = useState<Record | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = !!user && user.email === OWNER_EMAIL;

  const loadRecords = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("records")
      .select("*")
      .order("created_at", { ascending: false });
    setRecords((data ?? []) as Record[]);
  }, [supabase]);

  useEffect(() => {
    // When unconfigured, `loading` is never read (every branch is gated behind
    // `supabase`), so there's nothing to set here.
    if (!supabase) return;

    // getUser() only settles the auth UI state. The initial data load is owned
    // by onAuthStateChange below, which fires an INITIAL_SESSION event with the
    // current session on subscribe — so loadRecords() runs exactly once on the
    // first owner load instead of twice. `.finally` guarantees the loading
    // spinner clears even if getUser() rejects (e.g. a network blip).
    supabase.auth
      .getUser()
      .then(({ data }) => setUser(data.user))
      .finally(() => setLoading(false));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email === OWNER_EMAIL) loadRecords();
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, loadRecords]);

  async function signIn() {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href },
    });
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  async function handleSubmit(values: RecordInput) {
    if (!supabase) return;
    setSaving(true);
    setError(null);
    const op = editing
      ? supabase.from("records").update(values).eq("id", editing.id)
      : supabase.from("records").insert(values);
    const { error } = await op;
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setShowForm(false);
    setEditing(null);
    loadRecords();
  }

  async function handleDelete(id: string) {
    if (!supabase) return;
    if (!confirm("Delete this record? This cannot be undone.")) return;
    const { error } = await supabase.from("records").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    loadRecords();
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-medium tracking-[-0.03em]">Admin</h1>

        {!supabase && (
          <Notice>
            Supabase isn&apos;t configured. Add{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
            <code className="font-mono">.env.local</code> to enable the admin
            tools.
          </Notice>
        )}

        {supabase && loading && (
          <p role="status" className="mt-8 text-muted">
            Loading…
          </p>
        )}

        {supabase && !loading && !user && (
          <div className="mt-8">
            <p className="text-muted">Sign in to manage the collection.</p>
            <button
              onClick={signIn}
              className="mt-4 rounded-full bg-ink px-6 py-2.5 text-sm text-card"
            >
              Sign in with Google
            </button>
          </div>
        )}

        {supabase && !loading && user && !isOwner && (
          <Notice>
            You&apos;re signed in as{" "}
            <strong>{user.email}</strong>, which isn&apos;t the owner account.{" "}
            <button onClick={signOut} className="underline">
              Sign out
            </button>
            .
          </Notice>
        )}

        {isOwner && (
          <div className="mt-8 space-y-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">
                Signed in as {user!.email} ·{" "}
                <button onClick={signOut} className="underline">
                  Sign out
                </button>
              </p>
              {!showForm && (
                <button
                  onClick={() => {
                    setEditing(null);
                    setShowForm(true);
                  }}
                  className="rounded-lg bg-ink px-5 py-2 text-sm text-card"
                >
                  + Add LP
                </button>
              )}
            </div>

            {error && <Notice tone="error">{error}</Notice>}

            {showForm && (
              <div className="rounded-lg border border-line bg-card p-6">
                <h2 className="mb-6 text-2xl font-medium tracking-[-0.02em]">
                  {editing ? "Edit record" : "New record"}
                </h2>
                <RecordForm
                  // Remount when switching records (or to "new") so the form
                  // re-initializes with the selected record's values.
                  key={editing?.id ?? "new"}
                  initial={editing ?? undefined}
                  saving={saving}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                />
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-line bg-card">
              <div className="flex items-center justify-between border-b border-line px-5 py-3 text-xs uppercase tracking-wide text-muted">
                <span>{records.length} records</span>
              </div>
              {records.length === 0 ? (
                <p className="px-5 py-10 text-center text-muted">
                  No records yet.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {records.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center gap-4 px-5 py-3"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-canvas">
                        {r.cover_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.cover_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/record/${r.id}`}
                          className="block truncate text-[16px] font-semibold leading-tight hover:underline"
                        >
                          {r.title}
                        </Link>
                        <span className="block truncate text-sm text-muted">
                          {r.artist} · {r.year ?? "—"}
                        </span>
                      </div>
                      <StarRating value={r.rating} />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditing(r);
                            setShowForm(true);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="rounded-md border border-line px-3 py-1.5 text-sm transition hover:border-ink"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="rounded-md border border-line px-3 py-1.5 text-sm text-accent transition hover:border-accent"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function Notice({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "error";
}) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={`mt-8 rounded-lg border px-5 py-4 text-sm ${
        tone === "error"
          ? "border-accent/40 bg-accent/5 text-accent"
          : "border-line bg-card text-muted"
      }`}
    >
      {children}
    </div>
  );
}
