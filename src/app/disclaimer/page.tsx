import { redirect } from "next/navigation";
import { getCurrentUser, hasAcceptedCurrentDisclaimer } from "@/lib/auth";
import { DisclaimerForm } from "./disclaimer-form";

export default async function DisclaimerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signup");
  if (await hasAcceptedCurrentDisclaimer(user.id)) redirect("/verify-identity");

  return <DisclaimerForm />;
}
