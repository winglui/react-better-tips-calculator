# Better Tips Calculator

A simple tip calculator. Type the bill amount and it instantly works out the tip and the total. You can round the total to a whole dollar and split the bill so everyone's share adds up to the exact cent.

**Version 1.0.0**

## Features

- **Instant tip and total.** The Bill Amount field has focus when the page loads, so you can start typing straight away. The tip defaults to 18%.
- **Set the tip your way.** Drag the Tip % slider, or type an exact tip amount and the percentage updates to match.
- **Round Up / Round Down.** Moves the total to the next or previous whole dollar. If the total is already a whole dollar, each press moves it by $1. Round Down never goes below the bill, so the tip can't go negative.
- **Split the bill.** Choose 1–20 people. When the total doesn't divide evenly, the leftover cents are shared out, for example "2 pay $19.67, 1 pays $19.66", so the shares always add up to the total.
- **Dollar amounts.** Totals and shares are formatted as US dollars, for example `$1,234.50`.
- **Reset** clears everything back to the start.

## Tech stack

- [React 19](https://react.dev/) + TypeScript, built with [Vite](https://vite.dev/)
- [MUI (Material UI) v7](https://mui.com/) components with a dark theme
- [Tailwind CSS v4](https://tailwindcss.com/) for layout

## Getting started

Requires [Node.js](https://nodejs.org/) 20.19+ or 22.12+ (the versions Vite 7 needs).

```bash
git clone https://github.com/winglui/react-better-tips-calculator.git
cd react-better-tips-calculator
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## How it works

All the calculator logic is in [`src/components/Main.tsx`](src/components/Main.tsx). React state holds only what the user enters: the bill, the tip percentage, and the split settings. The tip amount and total are calculated from those on every render, with the tip kept to whole cents. Typing a tip amount or rounding the total sets the tip percentage that produces it.
