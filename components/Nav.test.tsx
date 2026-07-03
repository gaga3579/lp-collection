import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Nav highlights the active link via usePathname; pretend we're on "/".
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// Auth state is driven through a mocked Supabase browser client.
const getUser = vi.fn();
const unsubscribe = vi.fn();
const onAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe } },
}));
let clientValue: unknown = {
  auth: { getUser, onAuthStateChange },
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => clientValue,
}));

// Nav captures `process.env.NEXT_PUBLIC_OWNER_EMAIL` into a module-level
// constant at import time, so each test sets the env var, resets the module
// registry, then dynamically imports a fresh copy of the component.
async function loadNav() {
  vi.resetModules();
  // Re-register mocks for the freshly reset module graph.
  vi.doMock("next/link", () => ({
    default: ({
      href,
      children,
      ...rest
    }: {
      href: string;
      children: React.ReactNode;
    }) => (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
  }));
  vi.doMock("@/lib/supabase/client", () => ({
    createClient: () => clientValue,
  }));
  vi.doMock("next/navigation", () => ({
    usePathname: () => "/",
  }));
  const mod = await import("./Nav");
  return mod.default;
}

beforeEach(() => {
  getUser.mockReset();
  onAuthStateChange.mockClear();
  unsubscribe.mockClear();
  clientValue = { auth: { getUser, onAuthStateChange } };
  delete process.env.NEXT_PUBLIC_OWNER_EMAIL;
  // Default: not signed in.
  getUser.mockResolvedValue({ data: { user: null } });
});

describe("Nav", () => {
  it("always shows the brand and primary links", async () => {
    const Nav = await loadNav();
    render(<Nav />);
    expect(screen.getByRole("link", { name: "Vinyl Archive" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Collection" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Stats" })).toHaveAttribute("href", "/stats");
  });

  it("shows the plain 'Admin' link when no one is signed in", async () => {
    const Nav = await loadNav();
    render(<Nav />);
    expect(await screen.findByRole("link", { name: "Admin" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "+ Add LP" })).not.toBeInTheDocument();
  });

  it("shows '+ Add LP' when the signed-in user is the owner", async () => {
    process.env.NEXT_PUBLIC_OWNER_EMAIL = "owner@example.com";
    getUser.mockResolvedValue({ data: { user: { email: "owner@example.com" } } });
    const Nav = await loadNav();
    render(<Nav />);
    expect(await screen.findByRole("link", { name: "+ Add LP" })).toHaveAttribute("href", "/admin");
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("keeps the plain 'Admin' link when a non-owner is signed in", async () => {
    process.env.NEXT_PUBLIC_OWNER_EMAIL = "owner@example.com";
    getUser.mockResolvedValue({ data: { user: { email: "someone@else.com" } } });
    const Nav = await loadNav();
    render(<Nav />);
    expect(await screen.findByRole("link", { name: "Admin" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "+ Add LP" })).not.toBeInTheDocument();
  });

  it("renders without crashing when Supabase is not configured (null client)", async () => {
    clientValue = null;
    const Nav = await loadNav();
    render(<Nav />);
    expect(screen.getByRole("link", { name: "Admin" })).toBeInTheDocument();
    // getUser must never be reached when the client is null.
    expect(getUser).not.toHaveBeenCalled();
  });
});
