# How Theme Lab was built

Notes on the design decisions behind the app — what the problem actually was, and why
the code is shaped the way it is. Written for anyone reading the source cold.

## The problem

Every color tool I'd used showed palettes as swatch grids. That's the one context where a
palette can't fail: no text sitting on a background, no button next to a card, no chart
series competing with each other. You pick five colors that look balanced in isolation,
paste them into a real project, and only then discover the secondary is invisible on the
background and the accent fights the primary.

So the goal wasn't "a nicer color picker." It was: **shorten the loop between changing a
color and seeing the consequence.** Everything else follows from that.

## The one decision that made it work: chrome vs. canvas

The first version of this app themed *itself*. The landing page was simultaneously the
marketing site and the demo surface, which meant two things went wrong at once: you
couldn't tell which parts were "the tool" and which were "the thing being designed", and
picking a dark theme could make the controls unreadable.

v2 splits the two explicitly, and it's enforced at the token level:

| Layer | Tokens | Re-themes? |
|---|---|---|
| App chrome — top bar, editor sidebar | `--app-bg`, `--app-surface`, `--app-text`, … | Never |
| Preview canvas — everything inside `.preview-surface` | `--color-primary`, `--color-text`, `--body-font-family`, … | Live |

The canvas is then wrapped in browser-window chrome (traffic-light dots, a fake URL bar, a
`LIVE PREVIEW` badge) and filled with a plausible fake SaaS product rather than copy about
Theme Lab. The framing does the explaining — you understand the tool before reading a word,
and the controls stay legible no matter how bad the theme you build is.

## State

All theme state is one `useReducer` in [`ThemeContext.jsx`](../src/contexts/ThemeContext.jsx).
Not `useState` per color — undo/redo needs to restore a *set* of values atomically, and five
independent setters can't give you that without a coordinating layer anyway.

The state shape:

```js
{
  colors: { primary, secondary, accent, background, text },
  fonts:  { header, body },
  themeName, isCustom, isDarkMode,
  locked:     { primary: false, … },  // which swatches survive Randomize
  past: [], future: [], checkpoint: null,
}
```

`past` / `future` hold *snapshots* — `{ colors, fonts, themeName, isCustom, locked }` — not
diffs. At a 50-entry cap and five hex strings per entry, diffing would be a lot of machinery
to save a few hundred bytes.

### The drag problem

This is the part worth reading. A native `<input type="color">` fires `input` continuously
while you drag — dozens of events per second. Recording each one gives you an undo stack
where "undo" moves the color by one imperceptible step, and 50 entries of history covers
about half a second of dragging.

The fix is two actions instead of one:

- `PREVIEW_COLOR` — updates the swatch, records **no** history entry, but stashes a one-time
  `checkpoint` of the pre-drag state (`state.checkpoint ?? snapshot(state)` — so only the
  first event in a gesture captures it).
- `COMMIT_COLOR` — fires on release, and pushes that stashed checkpoint onto `past`.

The whole gesture becomes exactly one undoable edit, and the preview still updates on every
frame. `withHistory()` handles the simple discrete actions (presets, fonts, randomize) the
obvious way.

Locks are deliberately *not* on the undo stack. Locking is a statement about how you want
the next randomize to behave, not a change to the theme — undoing back past a lock toggle
would be surprising.

### Where initial state comes from

Precedence in [`buildInitialState()`](../src/contexts/ThemeContext.jsx), highest first:

1. **`?theme=` in the URL** — a shared link must reproduce exactly, so it beats everything.
2. **`localStorage`** — your last session, so a refresh never loses work.
3. **`prefers-color-scheme`** — first visit starts in the mode you already use.

History is never persisted. Restoring someone's undo stack from three days ago is worse than
starting clean.

## Applying the theme

The provider pushes seven CSS custom properties onto `document.documentElement` in an
effect keyed on `[colors, fonts, isDarkMode]`:

```js
root.style.setProperty("--color-primary", colors.primary);
// …
root.setAttribute("data-theme", isDarkMode ? "dark" : "light");
```

Themed components never read color from JS — they're plain CSS referencing
`var(--color-primary)`. A theme change repaints without re-rendering the preview tree, which
is why dragging a swatch stays smooth even with the dashboard's charts mounted.

The hook lives in its own module ([`useTheme.js`](../src/contexts/useTheme.js)) rather than
next to the provider, so `ThemeContext.jsx` only exports components. Mixing hook and
component exports in one file makes Vite's fast refresh remount the provider on every edit,
wiping the theme you were working on.

## Color math

[`lib/theme.ts`](../src/lib/theme.ts) holds the pure logic — chroma-js, no React.

`generateVariant()` derives the opposite light/dark variant from a custom palette by
nudging each color until it clears a contrast ratio against the derived background. That
loop is **bounded**:

```js
let guard = 0;
while (chroma.contrast(c, background) < min && guard < 24) { … guard += 1; }
```

The original was an unbounded `while`. A color that clamps at pure black or white can never
reach the target ratio, so the condition stays true forever and the tab locks up. Worth
remembering that any "adjust until it's good enough" loop needs an escape hatch.

`randomColors()` builds from a single random base hue and a `chroma.scale` toward `+120°`
rather than picking five independent random colors — independent randoms essentially never
look like a palette. Locked slots are passed through untouched.

## Contrast grading

`ContrastPanel` grades the pairings the preview actually renders — body text on background,
headings, button labels, accent on background — against WCAG 2.1: AAA at 7:1, AA at 4.5:1,
Fail below. Grading only real pairings matters; a full 5×5 matrix would be mostly cells that
never touch each other on screen, and the noise would hide the two that matter.

## Sharing

`encodeTheme()` packs five hex values, two font names and a dark-mode flag into base64url:

```js
{ c: ["4F46E5", …], f: ["Poppins", "Inter"], d: 1 }
```

Stripping `#`, using single-letter keys and URL-safe base64 keeps a full theme at roughly
120 characters — short enough to paste into Slack without it wrapping. `decodeTheme()`
validates the array length and returns `null` on anything malformed, so a mangled link falls
back to defaults instead of crashing.

## Making it useful to an assistant

The original version only pointed one way: design here, export CSS. That was the right shape in 2024 and the wrong one now. Generating a palette is the cheap half — any assistant does it instantly. The expensive half is knowing whether it holds up.

So the same core runs in three places:

- **The web app** — paste tokens in, see them on a real landing page, sign-in screen and dashboard, graded.
- **`theme-lab check`** — a CLI that exits non-zero when a pairing drops below AA, so contrast regressions fail a build instead of surviving review.
- **An MCP server** — `check_contrast`, `parse_tokens`, `export_theme`, `preview_theme`, so an assistant can grade its own palette before writing any CSS.

That meant pulling the logic out of the components into `src/lib/` as strict TypeScript with no DOM access. Node can't import a module that touches `document`, and that constraint turned out to be a good architectural forcing function — it's the same boundary that makes the logic testable.

### The grader has to describe reality

Adding a CLI exposed a bug I'd introduced earlier. The audit graded "Button label" as `background`-on-`primary`, which *was* what the CSS did — until I changed primary buttons to derive their label from `readableTextColor(primary)` to fix an unreadable sign-in panel. After that change the audit was measuring a pairing the browser never painted, and reporting failures nobody could act on.

`AUDIT_PAIRS` now marks that row `derived`, and `auditPalette` resolves the foreground the same way the DOM does. A row that reports a failure the user cannot fix is worse than no row.

### It failed its own test

The first CI run of the contrast gate went red on the project's own default theme: amber `#f59e0b` on white is **2.15:1**, well under the 3:1 that large text needs — and accent *is* rendered as text on the sign-in and landing pages.

Auditing every bundled preset showed 9 of 11 light variants failing, including one called "High Contrast" whose accent sat at 1.92:1. All of them are corrected now, and `tests/presets.test.ts` keeps them that way. A tool that grades other people's palettes has no business shipping ones that fail.

## Stack

React 18 + Vite (SWC), React Router, TypeScript for the core, Vitest for tests, chroma-js for all colour math, Recharts for the
dashboard charts, plain CSS with custom properties — no CSS-in-JS, since the whole theming
mechanism *is* custom properties and a runtime styling layer would just be in the way.

CI runs ESLint, `tsc`, the test suite, both builds, and the contrast gate on every push and PR.

## What I'd do next

- Adjustable type scale, reflected in the export.
- More export targets (SCSS, Style Dictionary tokens).
- Import a palette from an image or a pasted hex list.
- Adjustable type scale, reflected in the export and the audit.
