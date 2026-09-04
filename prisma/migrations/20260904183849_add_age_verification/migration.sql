-- AlterTable
ALTER TABLE "users" ADD COLUMN     "age_confirmed_at" TIMESTAMP(3),
ADD COLUMN     "identity_rejected_reason" TEXT;
