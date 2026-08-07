<div align="center">

<img src="public/favicon.svg" width="72" alt="Theme Lab logo" />

# Theme Lab

**Design a color theme, preview it on real UI, and export the CSS — instantly.**

Theme Lab is a live theme editor. Pick five colors and two fonts, watch them apply in real time to a real landing page, sign‑in screen and dashboard, keep an eye on WCAG contrast as you go, then export production‑ready CSS (or Tailwind / JSON) — or share the exact theme with a link. No account, nothing to install.

[**▶ Live demo**](https://react-color-tester.vercel.app/) · Built with React + Vite + chroma‑js

[![CI](https://github.com/Hashtagsmile/react-color-tester/actions/workflows/ci.yml/badge.svg)](https://github.com/Hashtagsmile/react-color-tester/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

![Theme Lab — the editor on the right, a live-themed dashboard in the preview window, WCAG contrast grading every text pairing](.github/assets/screenshot.png)

</div>

---

## Why it exists

Most color pickers show you swatches in a vacuum. The hard part isn't picking a nice blue — it's seeing how a whole palette behaves across real components, in light **and** dark, without failing contrast. Theme Lab is the fast feedback loop for that: everything you tweak lands immediately on believable UI, and the export is real code you can paste into a project.

## Features

- 🎨 **Five‑role palette** — primary, secondary, accent, background and text, edited live with the native color picker.
- 🔤 **Font pairing** — 20+ heading/body typefaces (Google Fonts + system), with live previews.
- 🖥️ **Real preview surfaces** — a marketing landing page, a sign‑in screen and an analytics dashboard, all re‑skinned instantly.
- 🌗 **Light & dark** — toggle the preview mode; custom themes derive a matching variant automatically.
- ♿ **Live WCAG contrast** — every meaningful text/background pairing is graded AA / AAA / Fail in real time.
- 🎲 **Presets, randomize & lock** — start from a curated preset, lock the colors you love, and randomize the rest around them.
- ↩️ **Undo / redo** — a proper history stack for every change.
- 📦 **Export** — copy CSS custom properties, a Tailwind config, or JSON — in HEX / RGB / HSL, for the current mode or both light and dark.
- 🔗 **Shareable links** — the full theme is encoded in the URL, and your work is auto‑saved to `localStorage`, so a refresh never loses it.

## How it works

1. **Pick your palette** in the sidebar — colors and fonts, from scratch or a preset. Lock what you like.
2. **See it on real UI** — switch between the landing / sign‑in / dashboard tabs and toggle dark mode.
3. **Export or share** — grab the CSS (both light and dark), or copy a link that reopens your exact theme.

## Tech stack

| Area | Choice |
|---|---|
| Framework | React 18 + Vite (SWC) |
| Routing | React Router |
| Color math | chroma‑js (conversions, contrast, scales) |
| Charts | Recharts |
| Icons | react‑icons |
| State | `useReducer` + Context, persisted to `localStorage` |

## Architecture notes

- **Chrome vs. canvas.** The app's own UI (top bar, sidebar) uses a fixed dark palette (`--app-*` variables) and never re‑themes. Only the preview surface — everything inside `.preview-surface` — consumes the live theme tokens (`--color-*`, `--*-font-family`). This keeps the tool readable while the canvas changes underneath it.
- **One source of truth.** All theme state lives in a single `useReducer` in [`ThemeContext`](src/contexts/ThemeContext.jsx): a theme object, lock map, and immutable undo/redo stacks. Live drags update without spamming history; the gesture is folded into one undoable edit on release.
- **Pure theme logic** (variant generation, randomization, URL encode/decode) is isolated in [`utilities/theme.js`](src/utilities/theme.js) and color/contrast helpers in [`utilities/utilities.js`](src/utilities/utilities.js).

📄 **[How it was built](docs/HOW_IT_WAS_BUILT.md)** — the longer version: why the chrome/canvas split exists, how the undo stack survives a color drag, and the unbounded loop that used to hang the tab.

## Getting started

**Prerequisites:** Node.js 18+ and npm.

```bash
git clone https://github.com/Hashtagsmile/react-color-tester.git
cd react-color-tester
npm install
npm run dev          # start the dev server (Vite, HMR)
```

Then open the local URL Vite prints (default `http://localhost:5173`).

```bash
npm run build        # production build → dist/
npm run preview      # preview the production build
npm run lint         # ESLint
```

## Roadmap

- [ ] Adjustable type scale (heading/body sizes) reflected in the export
- [ ] More export targets (SCSS, design tokens / Style Dictionary)
- [ ] Saveable palette gallery
- [ ] Import an existing palette from an image or hex list

## License

[MIT](LICENSE)
