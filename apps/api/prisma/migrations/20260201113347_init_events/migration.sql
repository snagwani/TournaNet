-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('TRACK', 'FIELD');

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "eventType" "EventType" NOT NULL,
    "gender" "Gender" NOT NULL,
    "category" "AthleteCategory" NOT NULL,
    "date" DATE NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "venue" VARCHAR(100),
    "rules" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_name_gender_category_key" ON "events"("name", "gender", "category");
