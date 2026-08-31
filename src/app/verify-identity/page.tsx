import { redirect } from "next/navigation";
import { getCurrentUser, hasAcceptedCurrentDisclaimer } from "@/lib/auth";
import { VerifyIdentityForm } from "./verify-identity-form";

export default async function VerifyIdentityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signup");
  if (!(await hasAcceptedCurrentDisclaimer(user.id))) redirect("/disclaimer");
  if (user.identityVerifiedAt) redirect("/profile");

  return <VerifyIdentityForm />;
}
