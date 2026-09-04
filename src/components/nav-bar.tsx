"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ONBOARDING_PREFIXES = ["/signup", "/verify", "/disclaimer", "/verify-identity"];

export function NavBar({ user }: { user: { isAdmin: boolean } | null }) {
  const pathname = usePathname();
  const isOnboarding = ONBOARDING_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    // A full navigation, not router.push, since the root layout reads the
    // session to render this nav bar itself -- a client-side transition
    // would reuse the already-mounted (signed-in) layout instead of
    // re-rendering it. See the matching note in verify-form.tsx.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/";
  }

  return (
    <header className="border-b bg-card">
      <nav className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
        <Link href="/" className="font-heading text-xl font-semibold tracking-tight">
          MusicianSearch
        </Link>

        {!isOnboarding && (
          <div className="flex items-center gap-2">
            <Link
              href="/musicians"
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Browse musicians
            </Link>
            {user ? (
              <>
                <Link
                  href="/messages"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Messages
                </Link>
                <Link
                  href="/profile"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  My profile
                </Link>
                {user.isAdmin && (
                  <Link
                    href="/admin"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Admin
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <Link href="/signup" className={cn(buttonVariants({ size: "sm" }))}>
                Sign in
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
