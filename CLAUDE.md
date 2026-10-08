# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev`: start the Vite dev server with HMR
- `npm run build`: type-check with `tsc -b` (project references: `tsconfig.app.json` for `src/`, `tsconfig.node.json` for the Vite config), then `vite build`
- `npm run lint`: ESLint (flat config in `eslint.config.js`)
- `npm run preview`: serve the production build

There is no test framework set up yet.

## Architecture

This is a single-page React 19 + TypeScript tip calculator built with Vite.

- **Styling uses two systems side by side.** MUI v7 (Material UI, with Emotion) supplies the components. Tailwind CSS v4 is loaded through the `@tailwindcss/vite` plugin and `@import "tailwindcss"` in `src/index.css`, and handles layout utilities (`flex`, `gap-*`, `m-*`). To override MUI's built-in styles with Tailwind, use the important modifier (e.g. `className="!p-0"` on `Slider`).
- **Theme:** `src/main.tsx` wraps the app in an MUI `ThemeProvider` with a dark palette plus `CssBaseline`. The custom `.label` class in `src/index.css` copies MUI's input-label look (white at 70% opacity, Roboto, 0.75rem) for plain `<p>` labels. It assumes the dark theme.
- **All calculator logic and state are in `src/components/Main.tsx`.** It holds one `useState` object (`billAmount`, `tipPercent`, `tipAmount`, `totalAmount`, `showGroup`, `split`), initialized from `INITIAL_VALUE`. Derived values (`tipAmount`, `totalAmount`, and `tipPercent` when you edit the tip amount or round the total) are stored in state, not computed during render. Each handler has to keep them in sync itself, so any new input must update every dependent field.
- Rounding (`roundUp`/`roundDown`) rounds the **total** to a whole number and then works backwards to get `tipAmount` and `tipPercent`.
- The split section shows only when `showGroup` is toggled on, and the action buttons show only when `billAmount > 0`.
- `Header.tsx` only displays the app bar. `App.tsx` places `Header` and `Main` inside an MUI `Container maxWidth="sm"`.

- Any code that derives `tipPercent` from a tip amount should go through `tipPercentFor()`. It keeps the current percentage when `billAmount` is 0 instead of dividing by zero.

## Android copy: keep in sync

`/Users/wlui/Documents/workingfolder/claude/better-tips-calculator-android` is a Capacitor Android copy of this app. **Every change made here must also be applied there**, including `src/`, `public/`, styling, dependencies and the docs in this file.
- Apply changes by hand or as a patch. Don't overwrite the Android copy's files wholesale, because some files differ there on purpose: `src/main.tsx` (bundled Roboto imports and the status bar setup), `index.html` (no Google Fonts links), the number `TextField`s in `src/components/Main.tsx` (`inputMode: "decimal"`), `package.json` (Capacitor dependencies and `android:*` scripts), and `eslint.config.js` (also ignores `android/`).
- Afterwards, run `npm run lint` and `npm run android:sync` in the Android copy.
