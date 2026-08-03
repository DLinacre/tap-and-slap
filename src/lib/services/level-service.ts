/**
 * Level service — resolves level slugs to DB rows, lazily materialising
 * dynamic daily-challenge levels so scoring works without a nightly job.
 */

import { prisma } from "@/lib/db";
import { getLevelDef } from "@/game/levels/registry";
import { isDailySlug, dailyDateFromSlug, buildDailyDef } from "@/game/levels/daily";
import type { LevelDef } from "@/game/levels/types";

function levelRowData(def: LevelDef) {
  const durMs = def.map.offsetMs + def.map.bars * 4 * (60_000 / def.map.bpm);
  return {
    slug: def.slug,
    title: def.title,
    artist: def.artist,
    description: def.description,
    bpm: def.bpm,
    difficulty: def.difficulty,
    noteCount: def.map.notes.length,
    durationSec: Math.round(durMs / 1000),
    mapJson: def.map as unknown as object,
  };
}

/** Upsert a level row from its definition (idempotent). */
export async function ensureLevelRow(def: LevelDef): Promise<string> {
  const row = await prisma.level.upsert({
    where: { slug: def.slug },
    update: levelRowData(def),
    create: { ...levelRowData(def), isPublished: true },
    select: { id: true },
  });
  return row.id;
}

/**
 * Resolve a slug to a DB level id. Built-ins are seeded; daily challenges are
 * materialised on first touch (valid dates only — future dates don't exist).
 */
export async function resolveLevelId(slug: string): Promise<string | null> {
  const existing = await prisma.level.findUnique({ where: { slug }, select: { id: true } });
  if (existing) return existing.id;
  if (!isDailySlug(slug)) return null;

  const date = dailyDateFromSlug(slug);
  if (!date) return null;
  if (date.getTime() > new Date().getTime()) return null;

  const def = buildDailyDef(date);
  const defCheck = getLevelDef(slug);
  if (!defCheck) return null;
  return ensureLevelRow(def);
}
