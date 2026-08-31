import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function VerifyIdentityReturnPage() {
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
