import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signup");

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Your profile</h1>
        <p className="text-sm text-muted-foreground">
          This is what other musicians see. Your email and phone number are
          never shown here or anywhere else on the site.
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}
