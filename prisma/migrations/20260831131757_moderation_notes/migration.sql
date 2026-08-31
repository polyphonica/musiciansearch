-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "reporter_notified_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "moderation_notes" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_notes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "moderation_notes" ADD CONSTRAINT "moderation_notes_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_notes" ADD CONSTRAINT "moderation_notes_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
