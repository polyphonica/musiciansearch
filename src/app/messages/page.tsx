import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ConversationList } from "./conversation-list";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signup");

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Messages</h1>
      <ConversationList />
    </div>
  );
}
