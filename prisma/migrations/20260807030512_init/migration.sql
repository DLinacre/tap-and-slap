-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Level" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bpm" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "noteCount" INTEGER NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "mapJson" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "levelId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "maxCombo" INTEGER NOT NULL,
    "perfects" INTEGER NOT NULL,
    "greats" INTEGER NOT NULL,
    "goods" INTEGER NOT NULL,
    "misses" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "autoplay" BOOLEAN NOT NULL DEFAULT false,
    "durationMs" INTEGER NOT NULL,
    "runId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Level_slug_key" ON "Level"("slug");

-- CreateIndex
CREATE INDEX "ScoreRun_levelId_difficulty_score_idx" ON "ScoreRun"("levelId", "difficulty", "score" DESC);

-- CreateIndex
CREATE INDEX "ScoreRun_userId_createdAt_idx" ON "ScoreRun"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ScoreRun_guestId_createdAt_idx" ON "ScoreRun"("guestId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ScoreRun_autoplay_idx" ON "ScoreRun"("autoplay");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreRun_runId_key" ON "ScoreRun"("runId");

-- AddForeignKey
ALTER TABLE "ScoreRun" ADD CONSTRAINT "ScoreRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreRun" ADD CONSTRAINT "ScoreRun_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;
