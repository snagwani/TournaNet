-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('FINISHED', 'DNS', 'DNF', 'DQ');

-- CreateTable
CREATE TABLE "results" (
    "id" TEXT NOT NULL,
    "heatId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "bibNumber" INTEGER NOT NULL,
    "resultValue" TEXT,
    "status" "ResultStatus" NOT NULL,
    "rank" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "results_heatId_athleteId_key" ON "results"("heatId", "athleteId");

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "heats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
