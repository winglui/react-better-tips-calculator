import assert from "node:assert/strict";
import { appTest, paste, readApp, setBill, setTip, setup, wheel } from "./helpers.mjs";

const ctx = setup();

appTest(ctx, "typing a minus sign in the Bill field is ignored", async (page) => {
  await page.keyboard.type("-50");
  const s = await readApp(page);
  assert.equal(s.bill, "50");
  assert.equal(s.total, "$59.00");
});

appTest(ctx, "typing a minus sign in the Tip field is ignored", async (page) => {
  await setBill(page, "50");
  await setTip(page, "-5");
  const s = await readApp(page);
  assert.equal(s.tip, "5");
  assert.equal(s.total, "$55.00");
  assert.equal(s.pct, "Tip % (10.00%)");
});

appTest(ctx, "pasting a negative bill becomes 0", async (page) => {
  await setBill(page, "50");
  await paste(page, "#billAmount", "-20");
  const s = await readApp(page);
  assert.equal(+s.bill, 0);
  assert.equal(s.total, "$0.00");
});

appTest(ctx, "pasting a negative tip becomes 0", async (page) => {
  await setBill(page, "50");
  await page.click("#tipAmount");
  await paste(page, "#tipAmount", "-7");
  await page.click("#billAmount");
  const s = await readApp(page);
  assert.equal(s.tip, "0.00");
  assert.equal(s.total, "$50.00");
  assert.equal(s.pct, "Tip % (0.00%)");
});

appTest(ctx, "scrolling the mouse wheel down stops the bill at 0", async (page) => {
  await setBill(page, "2");
  await wheel(page, "#billAmount", 100, 5);
  const s = await readApp(page);
  assert.ok(+s.bill >= 0, `bill ${s.bill}`);
  assert.ok(!s.total.includes("-"), `total ${s.total}`);
});

appTest(ctx, "scrolling the mouse wheel down stops the tip at 0", async (page) => {
  await setBill(page, "50");
  await setTip(page, "1");
  await wheel(page, "#tipAmount", 100, 4);
  await page.click("#billAmount");
  const s = await readApp(page);
  assert.ok(+s.tip >= 0, `tip ${s.tip}`);
  assert.ok(!s.pct.includes("-"), s.pct);
});

appTest(ctx, "normal decimal input still works", async (page) => {
  await setBill(page, "50.25");
  const s = await readApp(page);
  assert.equal(s.bill, "50.25");
  assert.equal(s.total, "$59.30");
});
