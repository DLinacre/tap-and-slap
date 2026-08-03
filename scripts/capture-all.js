const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 480, height: 860 } });

  // Menu (with new art + pills + daily card)
  await page.goto("http://localhost:3000/");
  await page.getByTestId("menu").waitFor({ state: "visible", timeout: 60_000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "screenshots/menu.png" });

  // Gameplay mid-run (new enemies, rings, city)
  await page.goto("http://localhost:3000/?autoplay=1&qa=1");
  await page.getByTestId("hud-score").waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForTimeout(5500);
  await page.screenshot({ path: "screenshots/gameplay.png" });

  // Results (grade + judgment bar + confetti)
  await page.getByTestId("gameover").waitFor({ state: "visible", timeout: 200_000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: "screenshots/results.png" });

  // Pause overlay
  await page.goto("http://localhost:3000/?autoplay=1&qa=1");
  await page.getByTestId("hud-score").waitFor({ state: "visible", timeout: 30_000 });
  await page.keyboard.press("Escape");
  await page.getByTestId("pause").waitFor({ state: "visible", timeout: 10_000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: "screenshots/pause.png" });

  await browser.close();
  console.log("screenshots saved");
})();
