-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "postal_code" TEXT;

-- CreateTable
CREATE TABLE "postal_code_locations" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "postal_code_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "postal_code_locations_country_code_key" ON "postal_code_locations"("country", "code");
