/* Capture an ~8s gameplay clip of the QA autoplay run and encode a GIF. */
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 480, height: 800 },
    recordVideo: { dir: "/tmp/gif-frames", size: { width: 480, height: 800 } },
  });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000/?autoplay=1&qa=1");
  await page.getByTestId("hud-score").waitFor({ state: "visible", timeout: 60_000 });
  await page.waitForTimeout(1200); // let the run warm up
  // 6 seconds of footage is plenty for a loop.
  await page.waitForTimeout(6000);
  await ctx.close(); // flushes the video
  await browser.close();
  console.log("video captured");
})();
