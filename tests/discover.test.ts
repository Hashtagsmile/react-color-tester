import { describe, expect, it } from "vitest";
import chroma from "chroma-js";
import {
  discoverPairs,
  soleVarName,
  extractTokens,
  isLargeText,
  parseRules,
  varName,
} from "../src/lib/discover";
import { auditTokens } from "../src/lib/audit";

/**
 * A stylesheet shaped like a real design system rather than five roles:
 * a primitive scale, a semantic layer aliasing it, several surfaces, and a
 * media query. Nothing here maps onto primary/secondary/accent/background/text.
 */
const REAL_WORLD = `
/* primitives */
:root {
  --gray-0: #ffffff;
  --gray-100: #f1f5f9;
  --gray-500: #64748b;
  --gray-900: #0f172a;
  --brand-500: #6366f1;
  --brand-700: #4338ca;
  --amber-400: #fbbf24;

  /* semantic layer aliases the primitives */
  --surface-base: var(--gray-0);
  --surface-raised: var(--gray-100);
  --text-primary: var(--gray-900);
  --text-muted: var(--gray-500);
  --brand: var(--brand-500);
  --warning: var(--amber-400);

  --radius: 8px;
  --font-body: "Inter", sans-serif;
}

body {
  background: var(--surface-base);
  color: var(--text-primary);
  font-family: var(--font-body);
}

.card {
  background-color: var(--surface-raised);
  color: var(--text-primary);
  border-radius: var(--radius);
}

.card__meta {
  color: var(--text-muted);
  background: var(--surface-raised);
  font-size: 0.8rem;
}

.badge--warning {
  color: var(--warning);
}

h1 {
  color: var(--brand);
  font-size: 2.5rem;
}

.btn-label {
  color: var(--gray-0);
  background: var(--brand-700);
  font-size: 15px;
  font-weight: 600;
}

@media (min-width: 900px) {
  .card__meta {
    color: var(--text-muted);
    background: var(--surface-raised);
    font-size: 19px;
    font-weight: bold;
  }
}
`;

describe("parseRules", () => {
  it("flattens rules, including inside at-rules", () => {
    const selectors = parseRules(REAL_WORLD).map((r) => r.selector);
    expect(selectors).toContain("body");
    expect(selectors).toContain(".card");
    expect(selectors).toContain(".btn-label");
    // The rule nested inside @media has to survive.
    expect(selectors.filter((s) => s === ".card__meta").length).toBeGreaterThanOrEqual(2);
  });

  it("strips comments so they can't be read as declarations", () => {
    const rules = parseRules(`/* color: red; */ .a { color: blue; }`);
    expect(rules).toHaveLength(1);
    expect(rules[0].declarations.get("color")).toBe("blue");
  });

  it("survives a stylesheet with no rules", () => {
    expect(parseRules("")).toEqual([]);
    expect(parseRules("/* nothing */")).toEqual([]);
  });
});

describe("varName", () => {
  it("reads the token out of a var() reference", () => {
    expect(varName("var(--brand-500)")).toBe("brand-500");
    expect(varName("var( --text-primary , #000 )")).toBe("text-primary");
  });

  it("returns null for a literal", () => {
    expect(varName("#ffffff")).toBeNull();
    expect(varName("rgb(1,2,3)")).toBeNull();
  });
});

describe("extractTokens", () => {
  const tokens = extractTokens(REAL_WORLD);

  it("finds primitives", () => {
    expect(tokens["gray-900"]).toBe("#0f172a");
    expect(tokens["brand-500"]).toBe("#6366f1");
  });

  it("follows semantic aliases through to a real colour", () => {
    expect(tokens["text-primary"]).toBe("#0f172a");
    expect(tokens["surface-base"]).toBe("#ffffff");
    expect(tokens["brand"]).toBe("#6366f1");
  });

  it("ignores custom properties that aren't colours", () => {
    expect(tokens["radius"]).toBeUndefined();
    expect(tokens["font-body"]).toBeUndefined();
  });

  it("terminates on a circular alias", () => {
    const tokens = extractTokens(`:root { --a: var(--b); --b: var(--a); }`);
    expect(tokens["a"]).toBeUndefined();
  });
});

describe("isLargeText", () => {
  const rule = (decls: string) => parseRules(`.x { ${decls} }`)[0];

  it("treats >=24px as large", () => {
    expect(isLargeText(rule("font-size: 24px;"))).toBe(true);
    expect(isLargeText(rule("font-size: 1.5rem;"))).toBe(true);
    expect(isLargeText(rule("font-size: 23px;"))).toBe(false);
  });

  it("treats >=18.66px as large when bold", () => {
    expect(isLargeText(rule("font-size: 19px; font-weight: 700;"))).toBe(true);
    expect(isLargeText(rule("font-size: 19px; font-weight: bold;"))).toBe(true);
    expect(isLargeText(rule("font-size: 19px;"))).toBe(false);
  });

  it("defaults to body text when there's no font-size", () => {
    expect(isLargeText(rule("color: red;"))).toBe(false);
  });
});

describe("discoverPairs", () => {
  const pairs = discoverPairs(REAL_WORLD);
  const find = (fg: string, bg: string) =>
    pairs.find((p) => p.foreground === fg && p.background === bg);

  it("finds pairings a single rule declares outright", () => {
    expect(find("text-primary", "surface-raised")?.origin).toBe("rule");
    expect(find("text-muted", "surface-raised")?.origin).toBe("rule");
    expect(find("gray-0", "brand-700")?.origin).toBe("rule");
  });

  it("pairs a lone text colour against the page background", () => {
    const badge = find("warning", "surface-base");
    expect(badge?.origin).toBe("implied");
  });

  it("carries the large-text flag from the same rule", () => {
    // h1 is 2.5rem, so it gets the 3:1 threshold rather than 4.5:1.
    expect(find("brand", "surface-base")?.large).toBe(true);
    // .card__meta at 0.8rem is body text.
    expect(pairs.find((p) => p.foreground === "text-muted" && !p.large)).toBeTruthy();
  });

  it("records where each pairing came from", () => {
    expect(find("gray-0", "brand-700")?.selector).toBe(".btn-label");
  });

  it("deduplicates a pairing repeated across selectors", () => {
    const smallMuted = pairs.filter(
      (p) => p.foreground === "text-muted" && p.background === "surface-raised" && !p.large,
    );
    expect(smallMuted).toHaveLength(1);
  });

  it("keeps the bold variant separate, since its threshold differs", () => {
    // The @media rule restates .card__meta at 19px bold — large text.
    const large = pairs.find(
      (p) => p.foreground === "text-muted" && p.background === "surface-raised" && p.large,
    );
    expect(large).toBeTruthy();
  });

  it("finds nothing in a stylesheet with no colours", () => {
    expect(discoverPairs(`.a { margin: 0; }`)).toEqual([]);
  });
});

describe("auditTokens", () => {
  const tokens = extractTokens(REAL_WORLD);
  const pairs = discoverPairs(REAL_WORLD);

  it("grades the discovered pairings", () => {
    const result = auditTokens(tokens, pairs);
    expect(result.rows.length).toBeGreaterThan(4);
    expect(result.rows.every((r) => r.foregroundHex.startsWith("#"))).toBe(true);
  });

  it("catches amber-on-white, the classic failure", () => {
    const result = auditTokens(tokens, pairs);
    const warning = result.failures.find((r) => r.foreground === "warning");
    expect(warning).toBeTruthy();
    expect(warning!.ratio).toBeLessThan(3);
  });

  it("passes body text on the page background", () => {
    const result = auditTokens(tokens, pairs);
    const body = result.rows.find(
      (r) => r.foreground === "text-primary" && r.background === "surface-base",
    );
    expect(body!.passes).toBe(true);
  });

  it("applies the stricter AAA thresholds when asked", () => {
    const aa = auditTokens(tokens, pairs, "AA");
    const aaa = auditTokens(tokens, pairs, "AAA");
    expect(aaa.failures.length).toBeGreaterThanOrEqual(aa.failures.length);
  });

  it("reports pairings it couldn't resolve rather than dropping them", () => {
    const result = auditTokens(tokens, [
      { foreground: "does-not-exist", background: "surface-base", selector: ".x", large: false, origin: "rule" },
    ]);
    expect(result.rows).toHaveLength(0);
    expect(result.unresolved).toHaveLength(1);
  });
});

describe("values that only mention a token", () => {
  it("ignores a token used inside color-mix", () => {
    // Reading the first var() out of a function produced pairings like
    // "text on text" at 1.00:1 — noise that teaches people to ignore the tool.
    expect(soleVarName("color-mix(in srgb, var(--text) 8%, transparent)")).toBeNull();
    expect(soleVarName("linear-gradient(var(--a), var(--b))")).toBeNull();
    expect(soleVarName("var(--brand)")).toBe("brand");
    expect(soleVarName("  var( --brand , #fff )  ")).toBe("brand");
    expect(soleVarName("var(--brand) !important")).toBe("brand");
  });

  it("produces no pairing from a color-mix background", () => {
    const pairs = discoverPairs(`
      :root { --text: #0f172a; --bg: #ffffff; }
      body { background: var(--bg); }
      .row:hover { color: var(--text); background: color-mix(in srgb, var(--text) 8%, transparent); }
    `);
    expect(pairs.every((p) => p.foreground !== p.background)).toBe(true);
  });
});

describe("surface resolution", () => {
  const CSS = `
    :root { --page: #0b0d12; --card: #ffffff; --ink: #0f172a; }
    body { background: var(--page); }
    .panel { background: var(--card); }
    .panel .label { color: var(--ink); }
  `;

  it("measures a nested element against its own surface, not the page", () => {
    // .label sits inside .panel, which paints --card. Grading it against
    // --page reports a failure that never renders.
    const pair = discoverPairs(CSS).find((p) => p.foreground === "ink");
    expect(pair?.background).toBe("card");
    expect(pair?.origin).toBe("implied");
  });

  it("falls back to the page background with no ancestor surface", () => {
    const pair = discoverPairs(`
      :root { --page: #ffffff; --ink: #777777; }
      body { background: var(--page); }
      .loose { color: var(--ink); }
    `).find((p) => p.foreground === "ink");
    expect(pair?.background).toBe("page");
  });

  it("matches a surface declared without the state suffix", () => {
    const pair = discoverPairs(`
      :root { --page: #000; --card: #fff; --ink: #111; }
      body { background: var(--page); }
      .card { background: var(--card); }
      .card:hover .title { color: var(--ink); }
    `).find((p) => p.foreground === "ink");
    expect(pair?.background).toBe("card");
  });
});

describe("color-mix", () => {
  const tokens = (css: string) => extractTokens(css);

  it("computes a tinted surface instead of reading its first ingredient", () => {
    // This resolved to #0f172a — the ink — turning a near-white surface into
    // near-black and reporting passing pairings as 1.00:1 failures.
    const t = tokens(`:root {
      --ink: #0f172a;
      --bg: #ffffff;
      --surface: color-mix(in srgb, var(--ink) 4%, var(--bg));
    }`);
    expect(t["surface"]).not.toBe(t["ink"]);
    expect(chroma(t["surface"]).luminance()).toBeGreaterThan(0.85);
  });

  it("honours the percentage on either side", () => {
    const t = tokens(`:root {
      --a: #000000; --b: #ffffff;
      --mostly-white: color-mix(in srgb, var(--a) 10%, var(--b));
      --mostly-black: color-mix(in srgb, var(--a) 90%, var(--b));
    }`);
    expect(chroma(t["mostly-white"]).luminance()).toBeGreaterThan(
      chroma(t["mostly-black"]).luminance(),
    );
  });

  it("defaults to an even mix with no percentages", () => {
    const t = tokens(`:root { --a: #000000; --b: #ffffff; --mid: color-mix(in srgb, var(--a), var(--b)); }`);
    expect(chroma(t["mid"]).luminance()).toBeGreaterThan(0.15);
    expect(chroma(t["mid"]).luminance()).toBeLessThan(0.35);
  });

  it("leaves a mix with transparent unresolved rather than guessing", () => {
    const t = tokens(`:root { --a: #123456; --x: color-mix(in srgb, var(--a) 8%, transparent); }`);
    expect(t["x"]).toBeUndefined();
  });

  it("resolves a mix nested inside another mix", () => {
    const t = tokens(`:root {
      --a: #000000; --b: #ffffff;
      --step1: color-mix(in srgb, var(--a) 50%, var(--b));
      --step2: color-mix(in srgb, var(--step1) 50%, var(--b));
    }`);
    expect(chroma(t["step2"]).luminance()).toBeGreaterThan(chroma(t["step1"]).luminance());
  });
});
