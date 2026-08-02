-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Level" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScoreRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "accuracy" REAL NOT NULL,
    "autoplay" BOOLEAN NOT NULL DEFAULT false,
    "durationMs" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScoreRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScoreRun_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
