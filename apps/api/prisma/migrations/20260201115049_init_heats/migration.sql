-- CreateTable
CREATE TABLE "heats" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "heatNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "heats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heat_lanes" (
    "id" TEXT NOT NULL,
    "heatId" TEXT NOT NULL,
    "laneNumber" INTEGER NOT NULL,
    "athleteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "heat_lanes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "heats_eventId_heatNumber_key" ON "heats"("eventId", "heatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "heat_lanes_heatId_laneNumber_key" ON "heat_lanes"("heatId", "laneNumber");

-- AddForeignKey
ALTER TABLE "heats" ADD CONSTRAINT "heats_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heat_lanes" ADD CONSTRAINT "heat_lanes_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "heats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heat_lanes" ADD CONSTRAINT "heat_lanes_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
