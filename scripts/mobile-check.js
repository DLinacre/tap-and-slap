const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 150)));
  await page.goto("http://localhost:3000/");
  await page.getByTestId("menu").waitFor({ state: "visible", timeout: 60_000 });
  await page.waitForTimeout(1000);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  const pads = await page.evaluate(() => document.querySelectorAll(".track-item").length);
  console.log("mobile 375px | horizontal overflow:", overflow, "| track items:", pads);
  await page.screenshot({ path: "screenshots/mobile-menu.png" });
  await ctx.close();
  await browser.close();
})();
