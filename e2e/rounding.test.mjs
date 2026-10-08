import assert from "node:assert/strict";
import { appTest, press, readApp, setBill, setup } from "./helpers.mjs";

const ctx = setup();

appTest(ctx, "Round Down then Round Up moves between whole dollars", async (page) => {
  await setBill(page, "10.33");
  assert.equal((await readApp(page)).total, "$12.19");
  await press(page, "Round down");
  let s = await readApp(page);
  assert.equal(s.total, "$12.00");
  assert.equal(s.tip, "1.67");
  assert.equal(s.pct, "Tip % (16.17%)");
  await press(page, "Round up");
  s = await readApp(page);
  assert.equal(s.total, "$13.00");
  assert.equal(s.tip, "2.67");
  assert.equal(s.pct, "Tip % (25.85%)");
});

appTest(ctx, "pressing again on a whole-dollar total steps $1", async (page) => {
  await setBill(page, "10.33");
  await press(page, "Round up");
  await press(page, "Round up");
  assert.equal((await readApp(page)).total, "$14.00");
  await press(page, "Round down");
  assert.equal((await readApp(page)).total, "$13.00");
  await press(page, "Round down");
  await press(page, "Round down");
  assert.equal((await readApp(page)).total, "$11.00");
});

appTest(ctx, "Round Down stops before the total would go below the bill", async (page) => {
  await setBill(page, "10.33");
  for (let i = 0; i < 5; i++) await press(page, "Round down");
  const s = await readApp(page);
  assert.equal(s.total, "$11.00");
  assert.equal(s.tip, "0.67");
});

appTest(ctx, "Round Down can reach a zero tip but shows 0.00, not -0.00", async (page) => {
  await setBill(page, "10");
  for (let i = 0; i < 5; i++) await press(page, "Round down");
  const s = await readApp(page);
  assert.equal(s.total, "$10.00");
  assert.equal(s.tip, "0.00");
});

appTest(ctx, "a total that's already whole steps by $1 (no float jump)", async (page) => {
  await setBill(page, "50");
  assert.equal((await readApp(page)).total, "$59.00");
  await press(page, "Round up");
  let s = await readApp(page);
  assert.equal(s.total, "$60.00");
  assert.equal(s.tip, "10.00");
  await press(page, "Round down");
  await press(page, "Round down");
  s = await readApp(page);
  assert.equal(s.total, "$58.00");
  assert.equal(s.tip, "8.00");
});
