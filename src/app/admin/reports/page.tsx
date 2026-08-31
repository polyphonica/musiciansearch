import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ReportsList } from "./reports-list";

export default async function AdminReportsPage() {
  if (!(await requireAdmin())) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Reports</h1>
      <p className="text-sm text-muted-foreground">
        Reports have no automatic effect — review each one and decide whether to suspend or ban
        the reported account.
      </p>
      <ReportsList />
    </div>
  );
}
