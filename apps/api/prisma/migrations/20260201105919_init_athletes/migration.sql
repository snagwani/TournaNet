-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "AthleteCategory" AS ENUM ('U14', 'U17', 'U19');

-- CreateTable
CREATE TABLE "athletes" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "category" "AthleteCategory" NOT NULL,
    "personalBest" TEXT,
    "bibNumber" SERIAL NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athletes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "athletes_bibNumber_key" ON "athletes"("bibNumber");

-- CreateIndex
CREATE UNIQUE INDEX "athletes_name_age_schoolId_key" ON "athletes"("name", "age", "schoolId");

-- AddForeignKey
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
