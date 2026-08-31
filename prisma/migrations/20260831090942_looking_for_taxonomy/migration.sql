/*
  Warnings:

  - You are about to drop the column `looking_for` on the `profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "looking_for",
ADD COLUMN     "looking_for_other" TEXT;

-- DropEnum
DROP TYPE "LookingFor";

-- CreateTable
CREATE TABLE "looking_for_options" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "looking_for_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_looking_for" (
    "profile_id" TEXT NOT NULL,
    "looking_for_option_id" TEXT NOT NULL,

    CONSTRAINT "profile_looking_for_pkey" PRIMARY KEY ("profile_id","looking_for_option_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "looking_for_options_name_key" ON "looking_for_options"("name");

-- AddForeignKey
ALTER TABLE "profile_looking_for" ADD CONSTRAINT "profile_looking_for_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_looking_for" ADD CONSTRAINT "profile_looking_for_looking_for_option_id_fkey" FOREIGN KEY ("looking_for_option_id") REFERENCES "looking_for_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
