import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";

const origin = "http://127.0.0.1:20139";
const launcher = fs.readFileSync("scripts/launchers/AntaresGateway-Review.ps1", "utf8");
const password = launcher.match(/INITIAL_PASSWORD = '([^']+)'/)?.[1];
assert.ok(password);
const browser = await chromium.launch({ channel: "chrome" });
try {
  const context = await browser.newContext({
    colorScheme: "light",
    reducedMotion: "no-preference",
  });
  const login = await context.request.post(`${origin}/api/auth/login`, {
    headers: { Origin: origin },
    data: { password },
  });
  assert.equal(login.status(), 200);
  const page = await context.newPage();
  const path = `${origin}/dashboard/settings/appearance`;
  await page.goto(path, { timeout: 45000 });
  const blur = page.locator('input[type="range"]').nth(0);
  const transparency = page.locator('input[type="range"]').nth(1);
  const picker = page.locator('input[type="color"]');
  await picker.waitFor();
  const snapshot = () =>
    page.evaluate(() => {
      const card = document.querySelector(".ci-card");
      const menu = document.querySelector(".antares-nav-panel");
      return {
        blur: getComputedStyle(card).backdropFilter,
        card: getComputedStyle(card).backgroundColor,
        menu: getComputedStyle(menu, "::before").backgroundColor,
        canvas: getComputedStyle(document.body).backgroundColor,
        glow: getComputedStyle(document.body, "::before").backgroundImage,
        motion: getComputedStyle(document.body, "::before").animationName,
        transform: getComputedStyle(document.body, "::before").transform,
      };
    });
  const initial = await snapshot();
  assert.equal(initial.blur, "blur(16px)");
  assert.equal(initial.motion, "antares-light-drift");
  await blur.focus();
  await blur.press("End");
  await transparency.focus();
  await transparency.press("End");
  await page.waitForFunction(
    () => getComputedStyle(document.querySelector(".ci-card")).backdropFilter === "blur(32px)"
  );
  assert.notEqual((await snapshot()).card, initial.card);
  await transparency.press("Home");
  await picker.fill("#19ac88");
  await page.waitForFunction(() =>
    document.documentElement.hasAttribute("data-antares-custom-accent")
  );
  const adjusted = await snapshot();
  for (const key of ["card", "menu", "canvas", "glow"])
    assert.notEqual(adjusted[key], initial[key], key);
  await page.waitForFunction(
    (start) => getComputedStyle(document.body, "::before").transform !== start,
    adjusted.transform,
    { timeout: 5000 }
  );
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("theme")).state.effects);
  assert.deepEqual(saved, { blur: 32, transparency: 0, accent: "#19ac88", motion: true });
  await page.reload();
  await page.waitForFunction(
    () => document.querySelector('input[type="color"]')?.value === "#19ac88"
  );
  assert.equal(await blur.inputValue(), "32");
  assert.equal(await transparency.inputValue(), "0");
  assert.equal(await picker.inputValue(), "#19ac88");
  const restored = await snapshot();
  for (const key of ["card", "menu", "canvas", "glow", "blur"])
    assert.equal(restored[key], adjusted[key], key);
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal((await snapshot()).motion, "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const toggle = page
    .locator(
      '[aria-label="Animate background light"], [aria-label="动态背景光"], [aria-label="動態背景光"]'
    )
    .first();
  await toggle.click();
  assert.equal((await snapshot()).motion, "none");
  await page
    .getByRole("button", { name: /Use palette color|恢復調色盤色彩|恢复调色板颜色/ })
    .click();
  assert.equal((await snapshot()).menu, initial.menu);
  console.log(
    "Chrome: keyboard sliders, live CSS, reload, motion reduction, pause, and color reset passed."
  );
} finally {
  await browser.close();
}
