import assert from "node:assert/strict";
import { appTest, readApp, setBill, setup } from "./helpers.mjs";

const ctx = setup();

appTest(ctx, "a $ is shown in front of the Bill and Tip fields", async (page) => {
  const adornments = await page.$$eval("#billAmount, #tipAmount", (inputs) =>
    inputs.map((i) => i.closest(".MuiInputBase-root").querySelector(".MuiInputAdornment-root")?.textContent),
  );
  assert.deepEqual(adornments, ["$", "$"]);
});

appTest(ctx, "the input values stay plain numbers while the total is in dollars", async (page) => {
  await setBill(page, "50");
  const s = await readApp(page);
  assert.equal(s.bill, "50");
  assert.equal(s.tip, "9.00");
  assert.equal(s.total, "$59.00");
});

appTest(ctx, "the tip % label has no $", async (page) => {
  await setBill(page, "50");
  assert.equal((await readApp(page)).pct, "Tip % (18.00%)");
});

appTest(ctx, "large totals get a thousands separator", async (page) => {
  await setBill(page, "1000");
  assert.equal((await readApp(page)).total, "$1,180.00");
});
