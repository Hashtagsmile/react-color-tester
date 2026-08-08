import { describe, expect, it } from "vitest";
import { applyBaseline, emptyBaseline, pairKey, requiredRatio, suggestPairFix } from "../src/lib/gate";
import { auditTokens } from "../src/lib/audit";
import { discoverPairs, extractTokens } from "../src/lib/discover";
import type { TokenAuditRow } from "../src/lib/audit";

const row = (
  foreground: string,
  background: string,
  large = false,
  extra: Partial<TokenAuditRow> = {},
): TokenAuditRow =>
  ({
    foreground,
    background,
    large,
    selector: ".x",
    origin: "rule",
    foregroundHex: "#777777",
    backgroundHex: "#ffffff",
    ratio: 2,
    rating: { label: "Fail", level: "fail", pass: false },
    passes: false,
    ...extra,
  }) as TokenAuditRow;

describe("requiredRatio", () => {
  it("uses WCAG's thresholds", () => {
    expect(requiredRatio(false, "AA")).toBe(4.5);
    expect(requiredRatio(true, "AA")).toBe(3);
    expect(requiredRatio(false, "AAA")).toBe(7);
    expect(requiredRatio(true, "AAA")).toBe(4.5);
  });
});

describe("pairKey", () => {
  it("identifies a pairing by its tokens and size, not its location", () => {
    // Moving a rule to another file shouldn't drop it out of the baseline and
    // turn an accepted failure back into a build break.
    expect(pairKey(row("a", "b", false))).toBe(pairKey(row("a", "b", false)));
    expect(pairKey({ foreground: "a", background: "b", large: false })).toBe("a on b");
    expect(pairKey({ foreground: "a", background: "b", large: true })).toBe("a on b (large)");
  });

  it("separates the large-text variant, since its threshold differs", () => {
    expect(pairKey(row("a", "b", true))).not.toBe(pairKey(row("a", "b", false)));
  });
});

describe("applyBaseline", () => {
  it("treats everything as new when there's no baseline", () => {
    const { fresh, known } = applyBaseline([row("a", "b"), row("c", "d")], emptyBaseline());
    expect(fresh).toHaveLength(2);
    expect(known).toHaveLength(0);
  });

  it("gates only on failures the baseline doesn't know about", () => {
    const { fresh, known } = applyBaseline([row("a", "b"), row("c", "d")], {
      accepted: ["a on b"],
    });
    expect(known.map(pairKey)).toEqual(["a on b"]);
    expect(fresh.map(pairKey)).toEqual(["c on d"]);
  });

  it("reports baseline entries that no longer fail, so the file can shrink", () => {
    const { fixed } = applyBaseline([row("a", "b")], { accepted: ["a on b", "gone on stale"] });
    expect(fixed).toEqual(["gone on stale"]);
  });

  it("drops ignored pairings entirely, from both sides", () => {
    const { fresh, known, fixed } = applyBaseline(
      [row("a", "b"), row("c", "d")],
      { accepted: ["c on d"] },
      ["a on b", "c on d"],
    );
    expect(fresh).toHaveLength(0);
    expect(known).toHaveLength(0);
    expect(fixed).toHaveLength(0);
  });
});

describe("suggestPairFix", () => {
  const css = `
    :root { --ink: #94a3b8; --page: #ffffff; --big: #b0b8c4; }
    body { background: var(--page); }
    .muted { color: var(--ink); background: var(--page); }
    .display { color: var(--big); background: var(--page); font-size: 2rem; }
  `;
  const tokens = extractTokens(css);
  const result = auditTokens(tokens, discoverPairs(css));

  it("suggests a colour that actually clears the threshold", () => {
    const failing = result.failures.find((r) => r.foreground === "ink")!;
    const fix = suggestPairFix(tokens, failing)!;
    expect(fix.token).toBe("ink");
    expect(fix.ratio).toBeGreaterThanOrEqual(4.5);
    expect(fix.to).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("applies the large-text threshold when the rule is large", () => {
    const failing = result.failures.find((r) => r.foreground === "big");
    if (!failing) return;
    expect(suggestPairFix(tokens, failing)!.ratio).toBeGreaterThanOrEqual(3);
  });

  it("aims higher for AAA", () => {
    const failing = result.failures.find((r) => r.foreground === "ink")!;
    expect(suggestPairFix(tokens, failing, "AAA")!.ratio).toBeGreaterThanOrEqual(7);
  });

  it("returns nothing when the token can't be resolved", () => {
    expect(suggestPairFix({}, result.rows[0])).toBeNull();
  });
});

describe("suggestions preserve the design", () => {
  const tokens = {
    white: "#ffffff",
    "sky-600": "#0284c7",
    ink: "#94a3b8",
    page: "#ffffff",
  };

  const failing = (fg: string, bg: string): TokenAuditRow =>
    row(fg, bg, false, { foregroundHex: tokens[fg as keyof typeof tokens] });

  it("darkens the surface rather than blackening white text", () => {
    // "Fix white on sky-600 by making the text #111111" passes the check and
    // destroys the button. The button darkens instead.
    const fix = suggestPairFix(tokens, failing("white", "sky-600"))!;
    expect(fix.token).toBe("sky-600");
    expect(fix.from).toBe("#0284c7");
    expect(fix.ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps light text lighter than its surface", () => {
    const fix = suggestPairFix(tokens, failing("white", "sky-600"))!;
    const toLum = (h: string) => parseInt(h.slice(1, 3), 16);
    expect(toLum(fix.to)).toBeLessThan(toLum("#0284c7") + 60);
  });

  it("still moves dark text on a light surface", () => {
    const fix = suggestPairFix(tokens, failing("ink", "page"))!;
    expect(fix.token).toBe("ink");
    expect(fix.ratio).toBeGreaterThanOrEqual(4.5);
  });
});
