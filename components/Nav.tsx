"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL;

/** Top navigation. The "+ Add LP" button only appears for the signed-in owner. */
export default function Nav() {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setIsOwner(!!data.user && data.user.email === OWNER_EMAIL);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsOwner(!!session?.user && session.user.email === OWNER_EMAIL);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-canvas/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-2xl tracking-tight">
          Vinyl Archive
        </Link>

        <div className="flex items-center gap-6 text-sm">
          <Link href="/" className="text-muted transition hover:text-ink">
            Collection
          </Link>
          <Link href="/stats" className="text-muted transition hover:text-ink">
            Stats
          </Link>
          {isOwner ? (
            <Link
              href="/admin"
              className="rounded-lg bg-ink px-4 py-2 text-card transition hover:opacity-90"
            >
              + Add LP
            </Link>
          ) : (
            <Link
              href="/admin"
              className="text-muted transition hover:text-ink"
            >
              Admin
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
