# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev`: start the Vite dev server with HMR
- `npm run build`: type-check with `tsc -b` (project references: `tsconfig.app.json` for `src/`, `tsconfig.node.json` for the Vite config), then `vite build`
- `npm run lint`: ESLint (flat config in `eslint.config.js`)
- `npm run preview`: serve the production build

- `npm test`: end-to-end tests in `e2e/*.test.mjs` (Puppeteer + Node's built-in `node:test`). Each file starts its own Vite dev server on a free port and a headless Chrome, so no dev server needs to be running.
- Run one file: `node --test e2e/split.test.mjs`. Run a single test by name: `node --test --test-name-pattern="Round Up" e2e/*.test.mjs`.

`e2e/helpers.mjs` has the shared pieces. `setup()` starts the server and browser lazily, on the first test, so a run filtered with `--test-name-pattern` doesn't hang. `appTest()` gives each test a fresh page and fails it on any console error. `readApp()` returns what's displayed (amounts as shown, e.g. `"$59.00"`), and `setBill`, `setTip`, `press`, `setSplit`, `paste` and `wheel` drive the UI. Add a test for every behavior change.

## Architecture

This is a single-page React 19 + TypeScript tip calculator built with Vite.

- **Styling uses two systems side by side.** MUI v7 (Material UI, with Emotion) supplies the components. Tailwind CSS v4 is loaded through the `@tailwindcss/vite` plugin and `@import "tailwindcss"` in `src/index.css`, and handles layout utilities (`flex`, `gap-*`, `m-*`). To override MUI's built-in styles with Tailwind, use the important modifier (e.g. `className="!p-0"` on `Slider`).
- **Theme:** `src/main.tsx` wraps the app in an MUI `ThemeProvider` with a dark palette plus `CssBaseline`. The custom `.label` class in `src/index.css` copies MUI's input-label look (white at 70% opacity, Roboto, 0.75rem) for plain `<p>` labels. It assumes the dark theme.
- **All calculator logic and state are in `src/components/Main.tsx`.** State holds only user inputs (`billAmount`, `tipPercent`, `showGroup`, `split`, initialized from `INITIAL_VALUE`). `tipAmount` and `totalAmount` are derived on every render, with the tip kept to whole cents (`toCents`). Never add derived values to state. Typing a tip amount or rounding goes through `setTipAmount()`, which sets the `tipPercent` that produces that amount. Because the tip is a percentage of the bill, a tip typed while the bill is 0 doesn't count toward the total. The tip field also has its own `tipText` state, which holds the raw text while you're editing it.
- Rounding (`roundUp`/`roundDown`) moves the **total** to the next or previous whole dollar, or by $1 if it's already whole. Round Down stops at the bill amount, and rounding then sets the matching tip %. The split (`splitBill`/`describeShares`) divides the total in whole cents, so the shares add up exactly.
- The split section shows only when `showGroup` is toggled on, and the action buttons show only when `billAmount > 0`.
- `Header.tsx` only displays the app bar. `App.tsx` places `Header` and `Main` inside an MUI `Container maxWidth="sm"`.

- Any code that derives `tipPercent` from a tip amount should go through `tipPercentFor()`. It keeps the current percentage when `billAmount` is 0 instead of dividing by zero.

## Android copy: keep in sync

`/Users/wlui/Documents/workingfolder/claude/better-tips-calculator-android` is a Capacitor Android copy of this app. **Every change made here must also be applied there**, including `src/`, `public/`, styling, dependencies and the docs in this file.
- Apply changes by hand or as a patch. Don't overwrite the Android copy's files wholesale, because some files differ there on purpose: `src/main.tsx` (bundled Roboto imports and the status bar setup), `index.html` (no Google Fonts links), the money `TextField`s in `src/components/Main.tsx` (`slotProps={{ ...moneySlotProps, htmlInput: { inputMode: "decimal" } }}` there vs `slotProps={moneySlotProps}` here), `package.json` (Capacitor dependencies and `android:*` scripts), `eslint.config.js` (also ignores `android/`), and the tests (copy `e2e/` changes across too; the Android copy also has `e2e/android-keypad.test.mjs`, `e2e-android/`, a `test:android` script and a `sharp` dev dependency).
- Afterwards, run `npm run lint` and `npm run android:sync` in the Android copy.
