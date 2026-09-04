import { redirect } from "next/navigation";
import { getCurrentUser, hasAcceptedCurrentDisclaimer } from "@/lib/auth";
import { VerifyIdentityForm } from "./verify-identity-form";

export default async function VerifyIdentityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signup");
  if (!(await hasAcceptedCurrentDisclaimer(user.id))) redirect("/disclaimer");
  if (user.identityVerifiedAt) redirect("/profile");

  if (user.identityRejectedReason === "underage") {
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

  return <VerifyIdentityForm />;
}
