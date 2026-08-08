import chroma from "chroma-js";
import { contrastRatio } from "./color.js";
import { AUDIT_PAIRS, auditPalette } from "./audit.js";
import { COLOR_KEYS } from "./types.js";
import type { AuditRow, ColorKey, LockMap, Palette } from "./types.js";

/**
 * Turning "this fails" into "here, I fixed it".
 *
 * A verdict the user can't act on is only half a tool. Every failing row can be
 * cleared by moving one colour along its own lightness axis, which keeps the
 * palette recognisably theirs — the hue doesn't change, only how dark it is.
 */

/** WCAG thresholds. Large text (>=18.66px bold or 24px) gets the lower bar. */
const threshold = (large: boolean) => (large ? 3 : 4.5);

/**
 * Aim slightly past the threshold rather than exactly at it.
 *
 * Fixes interact — darkening the background to rescue the accent shifts every
 * other pairing measured against it. A colour parked exactly on 3.00:1 gets
 * knocked under by the next adjustment and the loop never settles.
 */
const MARGIN = 1.08;

/**
 * Walk a colour toward the opposite end of the lightness scale until it clears
 * `target` against `background`. Bounded, for the same reason `generateVariant`
 * is: a colour that clamps at black or white never converges.
 */
export const nudgeToContrast = (color: string, background: string, target: number): string => {
  if (!chroma.valid(color) || !chroma.valid(background)) return color;
  if (contrastRatio(color, background) >= target) return color;

  const darken = chroma(background).luminance() > 0.5;
  let c = chroma(color);
  let guard = 0;

  while (chroma.contrast(c, background) < target && guard < 80) {
    c = darken ? c.darken(0.08) : c.brighten(0.08);
    guard += 1;
  }
  return c.hex();
};

export interface Suggestion {
  /** The swatch to change. */
  role: ColorKey;
  from: string;
  to: string;
  /** Contrast the pairing reaches once applied. */
  ratio: number;
  /** Why this pairing matters, in plain language. */
  reason: string;
}

/**
 * Propose the single smallest change that clears a failing row.
 *
 * Prefers moving the foreground: it's the text, and changing a background
 * ripples across the whole page. Falls back to the background when the
 * foreground is locked, and gives up rather than fighting the user's locks.
 */
export const suggestFix = (
  colors: Palette,
  row: AuditRow,
  locked?: LockMap,
): Suggestion | null => {
  if (row.rating.pass) return null;

  const target = threshold(row.large);
  const meta = AUDIT_PAIRS.find((p) => p.label === row.label);
  const reason = meta?.why ?? "";

  // A derived foreground (a button label) is already computed for readability,
  // so the only thing left to move is the surface underneath it.
  const candidates: ColorKey[] = row.derived
    ? [row.background]
    : [row.foreground, row.background];

  for (const role of candidates) {
    if (locked?.[role]) continue;

    const other = role === row.foreground ? colors[row.background] : colors[row.foreground];
    const fixed = nudgeToContrast(colors[role], other, target * MARGIN);
    if (fixed === colors[role]) continue;

    const ratio = contrastRatio(fixed, other);
    if (ratio >= target) {
      return { role, from: colors[role], to: fixed, ratio, reason };
    }
  }

  return null;
};

/** Every fix needed to clear a palette, one per failing pairing. */
export const suggestFixes = (colors: Palette, locked?: LockMap): Suggestion[] =>
  auditPalette(colors)
    .failures.map((row) => suggestFix(colors, row, locked))
    .filter((s): s is Suggestion => s !== null);

/**
 * Apply fixes until the palette passes or nothing more can move.
 *
 * Iterative because fixes interact: darkening the background to rescue the
 * accent changes every other pairing measured against it.
 */
export const makeAccessible = (colors: Palette, locked?: LockMap): Palette => {
  let next = { ...colors };

  for (let pass = 0; pass < 12; pass += 1) {
    const { failures } = auditPalette(next);
    if (!failures.length) break;

    let moved = false;
    for (const row of failures) {
      const suggestion = suggestFix(next, row, locked);
      if (!suggestion) continue;
      next = { ...next, [suggestion.role]: suggestion.to };
      moved = true;
    }
    // Everything left is locked or unreachable — stop rather than spin.
    if (!moved) break;
  }

  return next;
};

/** True when every role is pinned, so nothing can be adjusted. */
export const isFullyLocked = (locked: LockMap): boolean =>
  COLOR_KEYS.every((key) => locked[key]);
