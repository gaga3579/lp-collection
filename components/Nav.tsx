"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL;

/** Top navigation. The "+ Add LP" button only appears for the signed-in owner. */
export default function Nav() {
  const [isOwner, setIsOwner] = useState(false);
  const pathname = usePathname();

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

  const linkClass = (active: boolean) =>
    active ? "text-ink" : "text-muted transition hover:text-ink";

  return (
    <header className="gutter sticky top-0 z-10 bg-canvas/90 backdrop-blur">
      <nav className="flex items-center justify-between py-7">
        <Link href="/" className="text-[15px] font-semibold tracking-[-0.01em]">
          Vinyl Archive
        </Link>

        <div className="flex items-center gap-8 text-[13px]">
          <Link href="/" className={linkClass(pathname === "/")}>
            Collection
          </Link>
          <Link href="/stats" className={linkClass(pathname === "/stats")}>
            Stats
          </Link>
          {isOwner ? (
            <Link
              href="/admin"
              className="rounded-full bg-ink px-4 py-2 text-canvas transition hover:opacity-90"
            >
              + Add LP
            </Link>
          ) : (
            <Link href="/admin" className={linkClass(pathname === "/admin")}>
              Admin
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
