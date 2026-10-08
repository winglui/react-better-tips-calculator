import assert from "node:assert/strict";
import { appTest, press, readApp, setBill, setup } from "./helpers.mjs";

const ctx = setup();

const keys = async (page, key, times = 1) => {
  for (let i = 0; i < times; i++) await page.keyboard.press(key);
};

appTest(ctx, "Backspace edits the tip instead of snapping back to 2 decimals", async (page) => {
  await setBill(page, "100");
  await page.click("#tipAmount");
  await keys(page, "End");
  await keys(page, "Backspace", 3);
  assert.equal((await readApp(page)).tip, "18");
  await page.keyboard.type(".5");
  const s = await readApp(page);
  assert.equal(s.tip, "18.5");
  assert.equal(s.total, "$118.50");
});

appTest(ctx, "the tip field can be cleared and retyped", async (page) => {
  await setBill(page, "100");
  await page.click("#tipAmount");
  await keys(page, "End");
  await keys(page, "Backspace", 5);
  let s = await readApp(page);
  assert.equal(s.tip, "");
  assert.equal(s.total, "$100.00");
  await page.keyboard.type("7");
  s = await readApp(page);
  assert.equal(s.tip, "7");
  assert.equal(s.total, "$107.00");
});

appTest(ctx, "leaving the tip field formats it to 2 decimals", async (page) => {
  await setBill(page, "100");
  await page.click("#tipAmount");
  await page.keyboard.type("7");
  await page.click("#billAmount");
  const s = await readApp(page);
  assert.equal(s.tip, "7.00");
  assert.equal(s.pct, "Tip % (7.00%)");
});

appTest(ctx, "clicking into the tip field selects it, so typing replaces the tip", async (page) => {
  await setBill(page, "100");
  await page.click("#tipAmount");
  await page.keyboard.type("20");
  const s = await readApp(page);
  assert.equal(s.tip, "20");
  assert.equal(s.total, "$120.00");
});

appTest(ctx, "Round Up and the slider still update the tip field after editing", async (page) => {
  await setBill(page, "100");
  await page.click("#tipAmount");
  await page.keyboard.type("20");
  await page.click("#billAmount");
  await press(page, "Round up");
  let s = await readApp(page);
  assert.equal(s.tip, "21.00");
  assert.equal(s.total, "$121.00");
  await page.focus('input[aria-label="Tip Percent"]');
  await page.keyboard.press("ArrowRight");
  s = await readApp(page);
  assert.equal(s.tip, "22.00");
  assert.equal(s.total, "$122.00");
});
