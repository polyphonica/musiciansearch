import { notFound } from "next/navigation";
import { isMockIdentityEnabled } from "@/lib/config";
import { MockIdentityForm } from "./mock-form";

export default function MockIdentityPage() {
  if (!isMockIdentityEnabled()) notFound();
  return <MockIdentityForm />;
}
