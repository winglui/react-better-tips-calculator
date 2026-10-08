import assert from "node:assert/strict";
import { appTest, money, press, readApp, setBill, setSplit, setTip, setup } from "./helpers.mjs";

const ctx = setup();

// Add up what everyone pays, from text like "2 pay $19.67, 1 pays $19.66" or "$20.00" (each).
function sumShares(text, people) {
  const groups = [...text.matchAll(/(\d+) pays? (\$[\d,.]+)/g)];
  if (groups.length === 0) return { people, cents: people * Math.round(money(text) * 100) };
  return {
    people: groups.reduce((n, g) => n + +g[1], 0),
    cents: groups.reduce((n, g) => n + g[1] * Math.round(money(g[2]) * 100), 0),
  };
}

const cases = [
  // bill, tip, people, label, shares
  ["50", "9", 3, "Shares", "2 pay $19.67, 1 pays $19.66"],
  ["10", "0", 3, "Shares", "1 pays $3.34, 2 pay $3.33"],
  ["100", "0", 7, "Shares", "4 pay $14.29, 3 pay $14.28"],
  ["99.99", "0", 20, "Shares", "19 pay $5.00, 1 pays $4.99"],
  ["50", "10", 3, "Each Pays", "$20.00"],
  ["50", "9", 1, "Each Pays", "$59.00"],
];

for (const [bill, tip, people, label, shares] of cases) {
  appTest(ctx, `${bill} + ${tip} tip split ${people} ways shows "${shares}" and adds up exactly`, async (page) => {
    await setBill(page, bill);
    await setTip(page, tip);
    await page.click("#billAmount");
    await setSplit(page, people);
    const s = await readApp(page);
    assert.equal(s.split, `Split: ${people}`);
    assert.equal(s.shareLabel, label);
    assert.equal(s.shares, shares);
    assert.deepEqual(sumShares(s.shares, people), { people, cents: Math.round(money(s.total) * 100) });
  });
}

appTest(ctx, "the split can't go below 1 person", async (page) => {
  await setBill(page, "100");
  await setSplit(page, 1);
  await page.keyboard.press("ArrowLeft");
  const min = await page.$eval('input[aria-label="Split"]', (i) => [i.min, i.value]);
  assert.deepEqual(min, ["1", "1"]);
  assert.equal((await readApp(page)).shares, "$118.00");
});

appTest(ctx, "rounding updates the split", async (page) => {
  await setBill(page, "50");
  await setSplit(page, 3);
  await press(page, "Round Up");
  const s = await readApp(page);
  assert.equal(s.total, "$60.00");
  assert.equal(s.shareLabel, "Each Pays");
  assert.equal(s.shares, "$20.00");
});
