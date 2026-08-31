-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "qualifications" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_admin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "voice_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "voice_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_voice_types" (
    "profile_id" TEXT NOT NULL,
    "voice_type_id" TEXT NOT NULL,

    CONSTRAINT "profile_voice_types_pkey" PRIMARY KEY ("profile_id","voice_type_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "voice_types_name_key" ON "voice_types"("name");

-- AddForeignKey
ALTER TABLE "profile_voice_types" ADD CONSTRAINT "profile_voice_types_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_voice_types" ADD CONSTRAINT "profile_voice_types_voice_type_id_fkey" FOREIGN KEY ("voice_type_id") REFERENCES "voice_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
