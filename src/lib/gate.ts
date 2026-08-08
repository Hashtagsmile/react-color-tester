import { contrastRatio } from "./color.js";
import { nudgeToContrast } from "./remediate.js";
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
 * Moves the foreground: it's the text, and shifting a shared surface ripples
 * through every other pairing measured against it. Returns null when the token
 * can't reach the threshold at all, rather than suggesting a change that
 * doesn't actually fix anything.
 */
export const suggestPairFix = (
  tokens: TokenMap,
  row: TokenAuditRow,
  level: "AA" | "AAA" = "AA",
): PairSuggestion | null => {
  const target = requiredRatio(row.large, level);
  const from = tokens[row.foreground];
  const background = tokens[row.background];
  if (!from || !background) return null;

  const to = nudgeToContrast(from, background, target * 1.02);
  if (to === from) return null;

  const ratio = contrastRatio(to, background);
  if (ratio < target) return null;

  return { token: row.foreground, from, to, ratio };
};
