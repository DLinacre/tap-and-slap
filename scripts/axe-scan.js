const { chromium } = require("playwright");
const { AxeBuilder } = require("@axe-core/playwright");

const states = [
  { name: "menu", url: "http://localhost:3000/" },
  { name: "pause", url: "http://localhost:3000/?autoplay=1&qa=1", action: async (p) => { await p.waitForTimeout(1500); await p.keyboard.press("Escape"); await p.waitForTimeout(400); } },
];

(async () => {
  const browser = await chromium.launch();
  for (const st of states) {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 860 } });
    const page = await ctx.newPage();
    await page.goto(st.url);
    await page.getByTestId("menu").waitFor({ state: "visible", timeout: 60_000 }).catch(() => {});
    if (st.action) await st.action(page);
    await page.waitForTimeout(600);
    const results = await new AxeBuilder({ page }).analyze();
    console.log(`\n=== ${st.name} ===`);
    console.log("violations:", results.violations.length);
    for (const v of results.violations) {
      console.log(` - [${v.impact}] ${v.id}: ${v.help}`);
      for (const n of v.nodes.slice(0, 3)) {
        console.log(`     ${n.target.join(" ")} | ${(n.failureSummary || "").split("\n")[0]}`);
      }
    }
    await ctx.close();
  }
  await browser.close();
})();
