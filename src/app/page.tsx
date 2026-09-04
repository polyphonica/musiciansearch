import { getCurrentUser, hasProfile } from "@/lib/auth";
import { HomeHero } from "@/app/home-hero";

export default async function Home() {
  const user = await getCurrentUser();
  const primaryCta = user
    ? (await hasProfile(user.id))
      ? { href: "/profile", label: "View your profile" }
      : { href: "/profile", label: "Complete your profile" }
    : { href: "/signup", label: "Get started" };

  return <HomeHero primaryCta={primaryCta} />;
}
