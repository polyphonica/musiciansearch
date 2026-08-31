import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ConversationThread } from "./conversation-thread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/signup");

  const { id } = await params;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
      <ConversationThread conversationId={id} />
    </div>
  );
}
