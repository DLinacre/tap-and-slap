-- AlterTable
ALTER TABLE "ScoreRun" ADD COLUMN "runId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ScoreRun_runId_key" ON "ScoreRun"("runId");
