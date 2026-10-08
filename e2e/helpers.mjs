// Shared setup for the end-to-end tests: each test file starts its own Vite dev server and a
// headless Chrome, and each test gets a fresh page.
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));

/**
 * Dev server and browser for this test file. Call once at the top of the file. They start when the
 * first test runs (not in a `before` hook): with --test-name-pattern, a file whose tests are all
 * filtered out never runs `after`, so anything started up front would keep the process alive.
 */
export function setup() {
  const ctx = {};
  ctx.start = async () => {
    const server = await createServer({ root, server: { port: 0 }, logLevel: "silent", clearScreen: false });
    await server.listen();
    ctx.server = server;
    ctx.url = server.resolvedUrls.local[0];
    ctx.browser = await puppeteer.launch();
    // Warm-up load: after code adds a new import, Vite discovers the dependency on the first page
    // load and reloads the page. Doing that here keeps it from hitting a test mid-way (which shows up
    // as "Invalid hook call" errors from two copies of React).
    const warmup = await ctx.browser.newPage();
    await warmup.goto(ctx.url, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 500));
    await warmup.close();
  };
  after(async () => {
    await ctx.browser?.close();
    await ctx.server?.close();
  });
  return ctx;
}

/** Open the app in a new page. `page.errors` collects console errors and uncaught exceptions. */
export async function openApp(ctx, viewport) {
  ctx.started ??= ctx.start();
  await ctx.started;
  const page = await ctx.browser.newPage();
  if (viewport) await page.setViewport(viewport);
  page.errors = [];
  page.logs = [];
  page.on("console", (m) => {
    if (m.type() === "error") page.errors.push(m.text());
    else page.logs.push(`${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => page.errors.push(e.message));
  await page.goto(ctx.url, { waitUntil: "networkidle0" });
  return page;
}

/** A test that runs on a fresh page and also fails if the page logged any console errors. */
export function appTest(ctx, name, fn, viewport) {
  test(name, async () => {
    const page = await openApp(ctx, viewport);
    try {
      await fn(page);
      assert.deepEqual(page.errors, [], "console errors");
    } finally {
      await page.close();
    }
  });
}

/** Read everything the user can see, exactly as displayed (e.g. total "$59.00"). */
export function readApp(page) {
  return page.evaluate(() => {
    const labels = [...document.querySelectorAll("p.label")];
    const label = (start) => labels.find((x) => x.textContent.startsWith(start));
    const shareLabel = labels.find((x) => x.textContent === "Each Pays" || x.textContent === "Shares");
    return {
      active: document.activeElement?.id || null,
      bill: document.querySelector("#billAmount").value,
      tip: document.querySelector("#tipAmount").value,
      pct: label("Tip %").textContent,
      total: label("Total Amount").nextElementSibling.textContent,
      buttons: !!document.querySelector('[aria-label="Round up"]'),
      people: document.querySelector("#people").textContent,
      shareLabel: shareLabel?.textContent ?? null,
      shares: shareLabel?.nextElementSibling?.textContent ?? null,
    };
  });
}

/** Replace the bill with `value`, typing it like a user would. */
export async function setBill(page, value) {
  await page.focus("#billAmount");
  await page.$eval("#billAmount", (i) => i.select());
  await page.keyboard.type(String(value));
}

/** Click into the tip field (which selects it) and type `value`, replacing the old tip. */
export async function setTip(page, value) {
  await page.click("#tipAmount");
  await page.keyboard.type(String(value));
}

/** Click a button by its aria-label, e.g. "Round up". */
export function press(page, label) {
  return page.click(`[aria-label="${label}"]`);
}

/** Set the number of people with the People stepper's − / + buttons. */
export async function setPeople(page, people) {
  for (;;) {
    const current = +(await page.$eval("#people", (el) => el.textContent));
    if (current === people) return;
    await press(page, current < people ? "Add a person" : "Remove a person");
  }
}

/** Set an input's value the way a paste does, and fire an input event. */
export function paste(page, selector, value) {
  return page.$eval(
    selector,
    (input, v) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, v);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    },
    value,
  );
}

/** Scroll the mouse wheel `times` notches over an element (positive deltaY = down). */
export async function wheel(page, selector, deltaY, times = 1) {
  const box = await (await page.$(selector)).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < times; i++) {
    await page.mouse.wheel({ deltaY });
    await new Promise((r) => setTimeout(r, 150));
  }
}

/** "$1,234.50" -> 1234.5 */
export const money = (text) => +text.replace(/[$,]/g, "");
