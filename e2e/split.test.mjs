import assert from "node:assert/strict";
import { appTest, money, press, readApp, setBill, setPeople, setTip, setup } from "./helpers.mjs";

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
  ["50", "9", 2, "Each Pays", "$29.50"],
];

for (const [bill, tip, people, label, shares] of cases) {
  appTest(ctx, `${bill} + ${tip} tip split ${people} ways shows "${shares}" and adds up exactly`, async (page) => {
    await setBill(page, bill);
    await setTip(page, tip);
    await page.click("#billAmount");
    await setPeople(page, people);
    const s = await readApp(page);
    assert.equal(s.people, String(people));
    assert.equal(s.shareLabel, label);
    assert.equal(s.shares, shares);
    assert.deepEqual(sumShares(s.shares, people), { people, cents: Math.round(money(s.total) * 100) });
  });
}

appTest(ctx, "the People stepper is visible before a bill is entered", async (page) => {
  const s = await readApp(page);
  assert.equal(s.people, "1");
  assert.equal(s.shares, null);
  const disabled = await page.$$eval('[aria-label="Remove a person"], [aria-label="Add a person"]', (buttons) =>
    buttons.map((b) => b.disabled),
  );
  assert.deepEqual(disabled, [true, false]);
});

appTest(ctx, "the stepper goes from 1 to 20 and its buttons disable at the limits", async (page) => {
  await setBill(page, "100");
  await setPeople(page, 20);
  assert.equal(await page.$eval('[aria-label="Add a person"]', (b) => b.disabled), true);
  await setPeople(page, 1);
  assert.equal(await page.$eval('[aria-label="Remove a person"]', (b) => b.disabled), true);
  assert.equal((await readApp(page)).people, "1");
});

appTest(ctx, "the stepper works from the keyboard", async (page) => {
  await setBill(page, "100");
  await page.focus('[aria-label="Add a person"]');
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  assert.equal((await readApp(page)).people, "3");
});

appTest(ctx, "shares only show with 2 or more people", async (page) => {
  await setBill(page, "50");
  assert.equal((await readApp(page)).shares, null);
  await setPeople(page, 2);
  assert.equal((await readApp(page)).shares, "$29.50");
  await setPeople(page, 1);
  assert.equal((await readApp(page)).shares, null);
});

appTest(ctx, "clearing the bill hides the shares and the round/Reset buttons", async (page) => {
  await setBill(page, "50");
  await setPeople(page, 3);
  await setBill(page, "0");
  const s = await readApp(page);
  assert.equal(s.buttons, false);
  assert.equal(s.shares, null);
  assert.equal(s.people, "3");
});

appTest(ctx, "entering a bill again shows shares for the same number of people", async (page) => {
  await setBill(page, "50");
  await setPeople(page, 3);
  await setBill(page, "0");
  await setBill(page, "60");
  const s = await readApp(page);
  assert.equal(s.people, "3");
  assert.equal(s.shares, "$23.60"); // $70.80 / 3
});

appTest(ctx, "rounding updates the shares", async (page) => {
  await setBill(page, "50");
  await setPeople(page, 3);
  await press(page, "Round up");
  const s = await readApp(page);
  assert.equal(s.total, "$60.00");
  assert.equal(s.shareLabel, "Each Pays");
  assert.equal(s.shares, "$20.00");
});
