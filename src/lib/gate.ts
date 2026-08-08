import chroma from "chroma-js";
import { contrastRatio } from "./color.js";
import { nudgeDirectional } from "./remediate.js";
import type { TokenAuditRow } from "./audit.js";
import type { TokenMap } from "./discover.js";

/**
 * Turning an audit into something a team can actually adopt.
 *
 * A checker that fails the build on forty pre-existing problems gets removed
 * the same day it lands. The way linters solved this is a baseline: record what
 * is already broken, then fail only on things that get *worse*. That's the
 * difference between a tool people keep and a tool people mute.
 */

/** WCAG minimums. Large text gets the lower bar. */
export const requiredRatio = (large: boolean, level: "AA" | "AAA"): number =>
  level === "AAA" ? (large ? 4.5 : 7) : large ? 3 : 4.5;

/**
 * A stable identity for a pairing.
 *
 * Deliberately excludes the selector and the measured ratio: moving a rule to
 * another file, or nudging a colour without fixing it, shouldn't silently drop
 * an entry out of the baseline and turn it back into a build failure.
 */
export const pairKey = (row: { foreground: string; background: string; large: boolean }): string =>
  `${row.foreground} on ${row.background}${row.large ? " (large)" : ""}`;

export interface Baseline {
  /** Pairing keys that were already failing when the baseline was written. */
  accepted: string[];
}

export const emptyBaseline = (): Baseline => ({ accepted: [] });

export interface GateResult {
  /** Failures not in the baseline — these fail the build. */
  fresh: TokenAuditRow[];
  /** Failures the baseline already knows about. */
  known: TokenAuditRow[];
  /**
   * Baseline entries that no longer fail. Worth surfacing so the file can be
   * pruned — a baseline nobody shrinks is just a permanent exemption list.
   */
  fixed: string[];
}

/** Split failures into new vs. already-accepted, and report what got fixed. */
export const applyBaseline = (
  failures: TokenAuditRow[],
  baseline: Baseline,
  ignore: string[] = [],
): GateResult => {
  const accepted = new Set(baseline.accepted);
  const ignored = new Set(ignore);

  const fresh: TokenAuditRow[] = [];
  const known: TokenAuditRow[] = [];
  const stillFailing = new Set<string>();

  for (const row of failures) {
    const key = pairKey(row);
    if (ignored.has(key)) continue;
    stillFailing.add(key);
    if (accepted.has(key)) known.push(row);
    else fresh.push(row);
  }

  const fixed = baseline.accepted.filter((k) => !stillFailing.has(k) && !ignored.has(k));
  return { fresh, known, fixed };
};

export interface PairSuggestion {
  /** The token to change. */
  token: string;
  from: string;
  to: string;
  ratio: number;
}

/**
 * The smallest change that clears a failing pairing.
 *
 * Prefers moving the text — shifting a shared surface ripples through every
 * other pairing measured against it. But the move has to preserve the design's
 * polarity, so when the text is already pure white or black the surface moves
 * instead. Returns null rather than proposing something that doesn't actually
 * clear the threshold.
 */
export const suggestPairFix = (
  tokens: TokenMap,
  row: TokenAuditRow,
  level: "AA" | "AAA" = "AA",
): PairSuggestion | null => {
  const target = requiredRatio(row.large, level) * 1.02;
  const foreground = tokens[row.foreground];
  const background = tokens[row.background];
  if (!foreground || !background) return null;

  // Keep the design's polarity. If the text is lighter than its surface it has
  // to stay lighter — "fixing" white text on a mid-blue button by turning the
  // text black passes the check and destroys the button.
  const lightText = chroma(foreground).luminance() > chroma(background).luminance();

  const nudgedText = nudgeDirectional(foreground, background, target, !lightText);
  const textRatio = contrastRatio(nudgedText, background);
  if (textRatio >= target && nudgedText !== foreground) {
    return { token: row.foreground, from: foreground, to: nudgedText, ratio: textRatio };
  }

  // The text can't move far enough without inverting — usually because it's
  // already pure white or black. Move the surface instead.
  const nudgedSurface = nudgeDirectional(background, foreground, target, lightText);
  const surfaceRatio = contrastRatio(foreground, nudgedSurface);
  if (surfaceRatio >= target && nudgedSurface !== background) {
    return { token: row.background, from: background, to: nudgedSurface, ratio: surfaceRatio };
  }

  return null;
};
