import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function VerifyIdentityReturnPage() {
  const user = await getCurrentUser();

  // The webhook that sets identityVerifiedAt/identityRejectedReason usually
  // lands after this redirect, so the rejection may not show up yet here --
  // it's caught on the next visit to /verify-identity instead.
  if (user?.identityRejectedReason === "underage") {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Must be 18 or older</h1>
          <p className="text-sm text-muted-foreground">
            MusicianSearch requires everyone on the platform to be at least 18 years old. Based on
            the identity document you provided, we&apos;re unable to verify your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Verification submitted</h1>
        <p className="text-sm text-muted-foreground">
          Thanks — we&apos;re reviewing your identity verification now. This
          usually only takes a few minutes; we&apos;ll update your account as
          soon as it&apos;s confirmed.
        </p>
        <Link href="/" className={cn(buttonVariants({ size: "lg", className: "w-full" }))}>
          Return home
        </Link>
      </div>
    </div>
  );
}
