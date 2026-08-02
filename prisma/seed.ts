/**
 * Seed script — mirrors built-in levels into the DB and creates a demo user
 * plus plausible sample runs so leaderboards look alive.
 *
 * Run: `npm run db:setup` (migrate + seed) or `npx tsx prisma/seed.ts`.
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { getLevels } from "../src/game/levels/registry";

const prisma = new PrismaClient();

function plausibleRun(noteCount: number, difficulty: string, levelSlug: string) {
  const perfects = Math.floor(noteCount * 0.86);
  const greats = Math.floor(noteCount * 0.08);
  const goods = Math.floor(noteCount * 0.04);
  const misses = noteCount - perfects - greats - goods;
  const accuracy = ((perfects + 0.7 * greats + 0.4 * goods) / noteCount) * 100;
  // Score model: base 100 × weight × multiplier — approximated here.
  const score = Math.round((perfects + 0.7 * greats + 0.4 * goods) * 100 * 6);
  return {
    levelSlug,
    difficulty,
    perfects,
    greats,
    goods,
    misses,
    accuracy: Number(accuracy.toFixed(2)),
    score,
    maxCombo: Math.max(1, Math.floor(noteCount * 0.55)),
    durationMs: Math.round(noteCount * 0.42 * 1000),
  };
}

async function main(): Promise<void> {
  console.log("Seeding levels…");
  for (const def of getLevels()) {
    await prisma.level.upsert({
      where: { slug: def.slug },
      update: {
        title: def.title,
        artist: def.artist,
        description: def.description,
        bpm: def.bpm,
        difficulty: def.difficulty,
        noteCount: def.map.notes.length,
        durationSec: Math.round((def.map.offsetMs + def.map.bars * 4 * (60_000 / def.map.bpm)) / 1000),
        mapJson: def.map as unknown as object,
      },
      create: {
        slug: def.slug,
        title: def.title,
        artist: def.artist,
        description: def.description,
        bpm: def.bpm,
        difficulty: def.difficulty,
        noteCount: def.map.notes.length,
        durationSec: Math.round((def.map.offsetMs + def.map.bars * 4 * (60_000 / def.map.bpm)) / 1000),
        mapJson: def.map as unknown as object,
      },
    });
  }

  console.log("Seeding demo user…");
  const demoEmail = "demo@tapslap.dev";
  await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      username: "DemoSlapper",
      passwordHash: bcrypt.hashSync("tap-slap-demo", 10),
    },
  });
  const demoUser = await prisma.user.findUniqueOrThrow({ where: { email: demoEmail } });

  console.log("Seeding sample runs…");
  const guestIds = [
    "2f4a1c80-0000-4000-8000-000000000001",
    "2f4a1c80-0000-4000-8000-000000000002",
    "2f4a1c80-0000-4000-8000-000000000003",
  ];
  for (const def of getLevels()) {
    const level = await prisma.level.findUniqueOrThrow({ where: { slug: def.slug } });
    for (const [i, guestId] of guestIds.entries()) {
      const run = plausibleRun(def.map.notes.length, def.difficulty, def.slug);
      await prisma.scoreRun.create({
        data: {
          userId: i === 0 ? demoUser.id : null,
          guestId: i === 0 ? null : guestId,
          levelId: level.id,
          difficulty: run.difficulty,
          score: Math.round(run.score * (0.92 - i * 0.07)),
          maxCombo: Math.round(run.maxCombo * (0.95 - i * 0.06)),
          perfects: run.perfects,
          greats: run.greats,
          goods: run.goods,
          misses: run.misses,
          accuracy: run.accuracy,
          autoplay: false,
          durationMs: run.durationMs,
          createdAt: new Date(Date.now() - i * 86_400_000),
        },
      });
    }
  }

  console.log("Seed complete ✔");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
