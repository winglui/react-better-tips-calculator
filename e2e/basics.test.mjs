import assert from "node:assert/strict";
import { appTest, money, press, readApp, setBill, setPeople, setTip, setup } from "./helpers.mjs";

const ctx = setup();

appTest(ctx, "Bill Amount has focus on load, and typing replaces the 0", async (page) => {
  assert.equal((await readApp(page)).active, "billAmount");
  await page.keyboard.type("25");
  const s = await readApp(page);
  assert.equal(s.bill, "25");
  assert.equal(s.total, "$29.50");
});

appTest(ctx, "starts at bill 0, 18%, $0.00 with the action buttons hidden", async (page) => {
  const s = await readApp(page);
  assert.equal(s.bill, "0");
  assert.equal(s.tip, "0.00");
  assert.equal(s.pct, "Tip % (18.00%)");
  assert.equal(s.total, "$0.00");
  assert.equal(s.buttons, false);
});

appTest(ctx, "bill 50 at 18% gives tip 9.00 and total $59.00", async (page) => {
  await setBill(page, "50");
  const s = await readApp(page);
  assert.equal(s.tip, "9.00");
  assert.equal(s.total, "$59.00");
  assert.equal(s.buttons, true);
});

appTest(ctx, "the state isn't logged to the console on render", async (page) => {
  await setBill(page, "50");
  assert.deepEqual(page.logs.filter((l) => l.includes("billAmount")), []);
});

appTest(ctx, "typing a tip with no bill keeps the tip % finite and the total $0.00", async (page) => {
  await setTip(page, "5");
  assert.equal((await readApp(page)).tip, "5");
  await page.click("#billAmount");
  const s = await readApp(page);
  assert.equal(s.tip, "0.00");
  assert.equal(s.total, "$0.00");
  assert.equal(s.pct, "Tip % (18.00%)");
});

appTest(ctx, "typing a tip amount sets the matching tip %", async (page) => {
  await setBill(page, "100");
  await setTip(page, "5");
  assert.equal((await readApp(page)).pct, "Tip % (5.00%)");
});

appTest(ctx, "changing the bill after rounding keeps the rounded tip %", async (page) => {
  await setBill(page, "10.33");
  await press(page, "Round up");
  let s = await readApp(page);
  assert.equal(s.total, "$13.00");
  assert.equal(s.pct, "Tip % (25.85%)");
  await setBill(page, "20");
  s = await readApp(page);
  assert.equal(s.tip, "5.17");
  assert.equal(s.total, "$25.17");
});

appTest(ctx, "Reset goes back to the starting values", async (page) => {
  await setBill(page, "50");
  await setPeople(page, 3);
  await press(page, "Reset");
  const s = await readApp(page);
  assert.equal(s.bill, "0");
  assert.equal(s.pct, "Tip % (18.00%)");
  assert.equal(s.total, "$0.00");
  assert.equal(s.people, "1");
  assert.equal(s.shares, null);
});

appTest(ctx, "bill + tip always equals the total to the cent", async (page) => {
  const mismatches = [];
  for (const bill of ["0.01", "1.99", "10.33", "33.33", "47.85", "99.99", "123.45", "1000.07"]) {
    await setBill(page, bill);
    for (const steps of [0, 3, 7]) {
      await page.focus('input[aria-label="Tip Percent"]');
      for (let i = 0; i < steps; i++) await page.keyboard.press("ArrowRight");
      const s = await readApp(page);
      if (Math.round((+s.bill + +s.tip) * 100) !== Math.round(money(s.total) * 100)) mismatches.push(s);
    }
    await press(page, "Round up");
    const s = await readApp(page);
    if (!Number.isInteger(money(s.total)) || Math.round((+s.bill + +s.tip) * 100) !== Math.round(money(s.total) * 100)) {
      mismatches.push({ after: "Round up", ...s });
    }
    await press(page, "Reset");
  }
  assert.deepEqual(mismatches, []);
});

appTest(
  ctx,
  "fits a 390px phone screen: no horizontal scrolling, round buttons on one line, 44px stepper",
  async (page) => {
    await setBill(page, "84.37");
    await setPeople(page, 3);
    const layout = await page.evaluate(() => {
      const box = (label) => document.querySelector(`[aria-label="${label}"]`).getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        roundButtonsOnOneLine: box("Round down").top === box("Round up").top,
        stepperButtonHeights: [box("Remove a person").height, box("Add a person").height],
      };
    });
    assert.deepEqual(layout, { overflow: false, roundButtonsOnOneLine: true, stepperButtonHeights: [44, 44] });
  },
  { width: 390, height: 844, isMobile: true, hasTouch: true },
);
