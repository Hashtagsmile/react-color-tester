import chroma from "chroma-js";
import { isValidColor, toHex } from "./color.js";

/**
 * Work out a stylesheet's real colour pairings by reading the stylesheet.
 *
 * The five-role model (primary/secondary/accent/background/text) is fine for a
 * fixed preview, but no real design system looks like that — they have dozens of
 * tokens, several surface elevations and semantic states. Asking someone to
 * flatten all of that into five slots is asking them to describe a different
 * project than the one they have.
 *
 * So instead of assuming the pairings, derive them: a rule that sets both a text
 * colour and a background colour *is* a pairing the browser paints. Everything
 * here is textual — no DOM, no browser — so it runs in CI in milliseconds.
 */

export interface CssRule {
  selector: string;
  declarations: Map<string, string>;
}

export interface TokenMap {
  /** Custom-property name (without `--`) → resolved hex. */
  [token: string]: string;
}

export interface DiscoveredPair {
  foreground: string;
  background: string;
  /** Where in the stylesheet this pairing came from. */
  selector: string;
  /** WCAG treats large text more leniently; inferred from font-size/weight. */
  large: boolean;
  /**
   * `rule` — one rule set both colours, so this pairing is certain.
   * `implied` — a rule set only a text colour, paired against the page
   * background. Real, but a guess about which surface it lands on.
   */
  origin: "rule" | "implied";
}

const stripComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * Flatten a stylesheet into selector/declaration pairs.
 *
 * Brace-counting rather than a real parser: at-rules (`@media`, `@supports`) and
 * nested syntax get flattened to the rules inside them, which is exactly what we
 * want — a pairing inside a media query still renders.
 */
export const parseRules = (css: string): CssRule[] => {
  const source = stripComments(css);
  const rules: CssRule[] = [];

  let i = 0;
  let buffer = "";

  // Takes the string to scan explicitly — reading nested blocks out of the
  // top-level source instead of the enclosing block's body silently mangles
  // everything inside an @media.
  const readBlock = (text: string, start: number): { body: string; end: number } => {
    let depth = 1;
    let j = start;
    while (j < text.length && depth > 0) {
      if (text[j] === "{") depth += 1;
      else if (text[j] === "}") depth -= 1;
      j += 1;
    }
    return { body: text.slice(start, j - 1), end: j };
  };

  const parseBody = (selector: string, body: string) => {
    const declarations = new Map<string, string>();
    let k = 0;
    let decl = "";

    while (k < body.length) {
      const ch = body[k];

      if (ch === "{") {
        // A nested block — recurse so at-rules and nesting still contribute.
        const nestedSelector = decl.trim();
        const { body: nestedBody, end } = readBlock(body, k + 1);
        parseBody(nestedSelector || selector, nestedBody);
        decl = "";
        k = end;
        continue;
      }

      if (ch === ";") {
        const colon = decl.indexOf(":");
        if (colon > 0) {
          declarations.set(decl.slice(0, colon).trim(), decl.slice(colon + 1).trim());
        }
        decl = "";
        k += 1;
        continue;
      }

      decl += ch;
      k += 1;
    }

    const colon = decl.indexOf(":");
    if (colon > 0) {
      declarations.set(decl.slice(0, colon).trim(), decl.slice(colon + 1).trim());
    }

    if (declarations.size) rules.push({ selector, declarations });
  };

  while (i < source.length) {
    const ch = source[i];
    if (ch === "{") {
      const { body, end } = readBlock(source, i + 1);
      parseBody(buffer.trim(), body);
      buffer = "";
      i = end;
      continue;
    }
    buffer += ch;
    i += 1;
  }

  return rules;
};

/** `var(--brand-600, #fff)` → `brand-600`. Returns null for a literal value. */
export const varName = (value: string): string | null => {
  const m = /var\(\s*--([\w-]+)/.exec(value);
  return m ? m[1] : null;
};

/**
 * The token a declaration resolves to, but only when the value *is* that token.
 *
 * `background: color-mix(in srgb, var(--text) 8%, transparent)` mentions a token
 * without being it — reading the first `var()` out of the middle of a function
 * produces pairings like "text on text" at 1.00:1, which is noise that teaches
 * people to ignore the tool. Gradients and multi-layer backgrounds are skipped
 * for the same reason: there's no single colour to measure against.
 */
export const soleVarName = (value: string): string | null => {
  const trimmed = value.trim().replace(/\s*!important$/, "");
  const m = /^var\(\s*--([\w-]+)\s*(?:,[\s\S]*)?\)$/.exec(trimmed);
  return m ? m[1] : null;
};

/**
 * Every custom property that resolves to a colour.
 *
 * Follows `var()` aliases up to a few hops, so a semantic layer pointing at a
 * primitive scale (`--text-primary: var(--gray-900)`) still resolves.
 */
export const extractTokens = (css: string): TokenMap => {
  const raw = new Map<string, string>();

  for (const rule of parseRules(css)) {
    for (const [prop, value] of rule.declarations) {
      // First declaration wins: light scales are conventionally declared before
      // dark overrides, matching how the importer resolves the same ambiguity.
      if (prop.startsWith("--") && !raw.has(prop.slice(2))) {
        raw.set(prop.slice(2), value);
      }
    }
  }

  /** Split on commas that aren't inside parentheses. */
  const topLevelSplit = (input: string): string[] => {
    const parts: string[] = [];
    let depth = 0;
    let current = "";
    for (const ch of input) {
      if (ch === "(") depth += 1;
      else if (ch === ")") depth -= 1;
      if (ch === "," && depth === 0) {
        parts.push(current);
        current = "";
        continue;
      }
      current += ch;
    }
    parts.push(current);
    return parts.map((p) => p.trim()).filter(Boolean);
  };

  /**
   * Evaluate a value into a hex colour, following `var()` aliases and computing
   * `color-mix()`.
   *
   * color-mix matters more than it looks: design systems use it constantly for
   * tinted surfaces, and reading only its first ingredient resolved a near-white
   * surface to near-black — which reported real, passing pairings as 1.00:1
   * failures.
   */
  const evaluate = (value: string, depth: number): string | null => {
    if (depth > 8) return null;
    const trimmed = value.trim();

    const alias = soleVarName(trimmed);
    if (alias) return resolve(alias, depth + 1);

    const mix = /^color-mix\(\s*in\s+[\w-]+\s*,\s*([\s\S]+)\)$/.exec(trimmed);
    if (mix) {
      const parts = topLevelSplit(mix[1]);
      if (parts.length !== 2) return null;

      const parsed = parts.map((part) => {
        const pct = /(-?[\d.]+)%\s*$/.exec(part);
        const colorText = part.replace(/(-?[\d.]+)%\s*$/, "").trim();
        return { color: evaluate(colorText, depth + 1), weight: pct ? parseFloat(pct[1]) : null };
      });

      const [a, b] = parsed;
      // A mix involving `transparent` (or any alpha) has no fixed colour — what
      // renders depends on whatever is behind it. Contrast against that is
      // undefined, so leave it unresolved rather than inventing a value.
      if (!a.color || !b.color) return null;
      if (chroma(a.color).alpha() < 1 || chroma(b.color).alpha() < 1) return null;

      // Percentages are optional and may be given on either side; a lone value
      // implies the remainder goes to the other colour.
      let wa = a.weight;
      let wb = b.weight;
      if (wa === null && wb === null) wa = wb = 50;
      else if (wa === null) wa = 100 - (wb as number);
      else if (wb === null) wb = 100 - wa;

      const total = (wa as number) + (wb as number);
      if (total <= 0) return null;

      // chroma's ratio is the weight toward the second colour.
      return chroma.mix(a.color, b.color, (wb as number) / total, "rgb").hex();
    }

    return isValidColor(trimmed) ? toHex(trimmed) : null;
  };

  const resolve = (name: string, depth = 0): string | null => {
    if (depth > 8) return null;
    const value = raw.get(name);
    if (!value) return null;
    return evaluate(value, depth);
  };

  const tokens: TokenMap = {};
  for (const name of raw.keys()) {
    const hex = resolve(name);
    if (hex) tokens[name] = hex;
  }
  return tokens;
};

const FG_PROPS = ["color"];
const BG_PROPS = ["background-color", "background"];

/** Pull a token name out of a declaration, when the value is exactly that token. */
const tokenOf = (rule: CssRule, props: string[]): string | null => {
  for (const prop of props) {
    const value = rule.declarations.get(prop);
    if (!value) continue;
    const name = soleVarName(value);
    if (name) return name;
  }
  return null;
};

/** px equivalent of a CSS length, assuming a 16px root. Null when unparseable. */
const toPx = (value: string): number | null => {
  const m = /^(-?[\d.]+)(px|rem|em|pt)?$/.exec(value.trim());
  if (!m) return null;
  const n = parseFloat(m[1]);
  switch (m[2]) {
    case "rem":
    case "em":
      return n * 16;
    case "pt":
      return n * (96 / 72);
    default:
      return n;
  }
};

/**
 * WCAG's large-text carve-out: >=24px, or >=18.66px when bold.
 *
 * Reading it off the same rule matters — grading a 32px heading against the
 * 4.5:1 body threshold reports failures that aren't failures, and that's how a
 * checker trains people to ignore it.
 */
export const isLargeText = (rule: CssRule): boolean => {
  const size = rule.declarations.get("font-size");
  if (!size) return false;
  const px = toPx(size);
  if (px === null) return false;

  const weightRaw = rule.declarations.get("font-weight") ?? "";
  const weight = parseInt(weightRaw, 10);
  const bold = weightRaw === "bold" || (!Number.isNaN(weight) && weight >= 700);

  return px >= 24 || (bold && px >= 18.66);
};

/** Selectors that establish the page surface everything else sits on. */
const ROOT_SELECTOR = /^(:root|html|body|\*)$/;

/**
 * Derive the pairings a stylesheet actually renders.
 *
 * Direct pairings (one rule, both colours) are certain. A rule that sets only a
 * text colour is paired against the page background and marked `implied`, so a
 * report can be honest about which ones are inferred.
 */
export const discoverPairs = (css: string): DiscoveredPair[] => {
  const rules = parseRules(css);

  // The page surface: the background declared on :root / html / body.
  let pageBackground: string | null = null;
  for (const rule of rules) {
    if (!ROOT_SELECTOR.test(rule.selector.trim())) continue;
    const bg = tokenOf(rule, BG_PROPS);
    if (bg) {
      pageBackground = bg;
      break;
    }
  }

  // Which selectors establish a surface, so a nested element can be measured
  // against the thing it actually sits on rather than the page background.
  const surfaces = new Map<string, string>();
  for (const rule of rules) {
    const bg = tokenOf(rule, BG_PROPS);
    if (!bg) continue;
    for (const part of rule.selector.split(",")) {
      const key = part.trim();
      if (key && !surfaces.has(key)) surfaces.set(key, bg);
    }
  }

  /**
   * Walk up a descendant selector looking for an ancestor that paints a surface:
   * `.page-dashboard .card .label` tries `.page-dashboard .card`, then
   * `.page-dashboard`. Not a real cascade — but it's the difference between
   * measuring against the surface under the element and measuring against
   * whatever the document root happened to declare.
   */
  const surfaceFor = (selector: string): string | null => {
    const segments = selector.trim().split(/\s+/);
    for (let i = segments.length - 1; i > 0; i -= 1) {
      const ancestor = segments.slice(0, i).join(" ");
      const direct = surfaces.get(ancestor);
      if (direct) return direct;
      // `.card:hover` should also match a surface declared on `.card`. Strip
      // only trailing pseudo-classes and attribute selectors — anchoring on the
      // first `.` instead would eat the class name itself.
      const bare = ancestor.replace(/(::?[\w-]+(\([^)]*\))?|\[[^\]]*\])+$/, "");
      if (bare && bare !== ancestor && surfaces.get(bare)) return surfaces.get(bare)!;
    }
    return pageBackground;
  };

  const pairs: DiscoveredPair[] = [];
  const seen = new Set<string>();

  const add = (pair: DiscoveredPair) => {
    // One entry per (fg, bg, large) — the same pairing repeated across selectors
    // is one thing to fix, not twelve.
    const key = `${pair.foreground}|${pair.background}|${pair.large}`;
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push(pair);
  };

  for (const rule of rules) {
    const fg = tokenOf(rule, FG_PROPS);
    if (!fg) continue;

    const large = isLargeText(rule);
    const bg = tokenOf(rule, BG_PROPS);

    if (bg) {
      if (bg !== fg) {
        add({ foreground: fg, background: bg, selector: rule.selector, large, origin: "rule" });
      }
      continue;
    }

    const surface = surfaceFor(rule.selector);
    // Same token on both sides is a tint or an inherited value, not a pairing.
    if (surface && surface !== fg) {
      add({
        foreground: fg,
        background: surface,
        selector: rule.selector,
        large,
        origin: "implied",
      });
    }
  }

  return pairs;
};
