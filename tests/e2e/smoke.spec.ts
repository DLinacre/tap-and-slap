/**
 * E2E smoke tests.
 *
 * The suite leans on two debug affordances built into the game:
 *   ?autoplay=1  — a bot hits every note perfectly
 *   ?qa=1        — maps are truncated to 8 bars (~25s runs)
 * Together they make gameplay E2E deterministic without real input timing.
 */

import { test, expect } from "playwright/test";

test.describe("Tap & Slap smoke", () => {
  test("home page renders the menu", async ({ page }) => {
    await page.goto("/");
    // Cold dev servers compile the game chunks on first request — allow plenty
    // of time for the Phaser boot to complete and the menu to mount.
    await expect(page.getByTestId("menu")).toBeVisible({ timeout: 60_000 });
    // Daily challenge + 3 built-in level cards (the leaderboard is a separate list).
    await expect(page.getByRole("list", { name: "Levels" }).getByRole("listitem")).toHaveCount(4);
    await expect(page.locator(".level-card__daily")).toBeVisible();
  });

  test("QA autoplay run plays and reaches the results screen", async ({ page }) => {
    await page.goto("/?autoplay=1&qa=1");
    // Score starts climbing shortly after the run begins.
    const score = page.getByTestId("hud-score");
    await expect(score).not.toHaveText("0", { timeout: 30_000 });
    // The bot clears the map and the results screen appears with a grade.
    await expect(page.getByTestId("gameover")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("result-grade")).toBeVisible();
  });

  test("pause overlay toggles via keyboard", async ({ page }) => {
    await page.goto("/?autoplay=1&qa=1");
    await page.getByTestId("hud-score").waitFor({ state: "visible", timeout: 60_000 });
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("pause")).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("pause")).not.toBeVisible({ timeout: 10_000 });
  });

  test("API health endpoint reports ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { status: string; db: string };
    expect(body.status).toBe("ok");
    expect(body.db).toBe("up");
  });
});
