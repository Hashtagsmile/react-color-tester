import { isValidColor, toHex } from "./color.js";
import type { DiscoveredPair, TokenMap } from "./discover.js";

/**
 * Tailwind support.
 *
 * Tailwind splits the two halves of the problem across different files: colours
 * live in `tailwind.config.js`, and the pairings live in markup, as class lists.
 * So both have to be read — and a class list carrying both `text-*` and `bg-*`
 * is exactly the same signal as a CSS rule setting both `color` and
 * `background`: a pairing the browser paints.
 *
 * The default palette is deliberately *not* hardcoded here. Copying ~240 hex
 * values would drift from whatever version a project actually has installed, and
 * a wrong hex means a wrong verdict — worse than admitting we don't know. The
 * caller resolves `tailwindcss/colors` from the project instead and passes it in.
 */

/** Tailwind's text-size scale in px, for WCAG's large-text threshold. */
const TEXT_SIZES: Record<string, number> = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
  "6xl": 60,
  "7xl": 72,
  "8xl": 96,
  "9xl": 128,
};

const BOLD = new Set(["font-bold", "font-extrabold", "font-black", "font-semibold"]);

/**
 * Variants that change the whole surface, not just this element.
 *
 * A `hover:` background sits on top of the element's normal one, so the base
 * text colour still applies — the fallback is sound. `dark:` is different: the
 * surface underneath almost always changes too, usually on an ancestor. Falling
 * back to the light background there pairs dark-mode text against a light
 * surface, a combination that never renders.
 */
const THEME_VARIANTS = new Set([
  "dark",
  "light",
  "print",
  "forced-colors",
  "contrast-more",
  "contrast-less",
]);

const isThemeVariant = (variant: string): boolean =>
  variant.split(":").some((v) => THEME_VARIANTS.has(v));

/** Flatten `{ brand: { 500: "#..." } }` into `{ "brand-500": "#..." }`. */
export const flattenColors = (
  input: unknown,
  prefix = "",
  out: TokenMap = {},
): TokenMap => {
  if (!input || typeof input !== "object") return out;

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const name = prefix ? `${prefix}-${key}` : key;

    if (typeof value === "string") {
      // Tailwind allows `DEFAULT` for the bare class (`bg-brand`).
      const finalName = key === "DEFAULT" && prefix ? prefix : name;
      if (isValidColor(value)) out[finalName] = toHex(value);
      continue;
    }
    flattenColors(value, name, out);
  }
  return out;
};

/**
 * Pull the `colors` object out of a Tailwind config's source text.
 *
 * Textual rather than evaluated: a config is arbitrary JavaScript, and running
 * a project's build file to read a palette is not a trade worth making. Values
 * that aren't string literals (spreads, imports, functions) are skipped — the
 * caller merges the resolved defaults underneath.
 */
export const parseTailwindColors = (source: string): TokenMap => {
  const out: TokenMap = {};
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

  // Every `colors: {` block — a config may have one under `theme` and another
  // under `theme.extend`.
  const re = /\bcolors\s*:\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(withoutComments)) !== null) {
    let depth = 1;
    let i = match.index + match[0].length;
    const start = i;

    while (i < withoutComments.length && depth > 0) {
      if (withoutComments[i] === "{") depth += 1;
      else if (withoutComments[i] === "}") depth -= 1;
      i += 1;
    }

    parseColorBlock(withoutComments.slice(start, i - 1), "", out);
  }

  return out;
};

/** Recursively read `key: "value"` and `key: { … }` out of an object literal. */
const parseColorBlock = (body: string, prefix: string, out: TokenMap): void => {
  const keyRe = /(?:"([^"]+)"|'([^']+)'|([A-Za-z_$][\w$]*)|(\d+))\s*:\s*/g;
  let match: RegExpExecArray | null;

  while ((match = keyRe.exec(body)) !== null) {
    const key = match[1] ?? match[2] ?? match[3] ?? match[4];
    const rest = body.slice(keyRe.lastIndex);
    const name = prefix ? `${prefix}-${key}` : key;

    const nested = /^\{/.test(rest.trimStart());
    if (nested) {
      const open = body.indexOf("{", keyRe.lastIndex - 1);
      let depth = 1;
      let i = open + 1;
      while (i < body.length && depth > 0) {
        if (body[i] === "{") depth += 1;
        else if (body[i] === "}") depth -= 1;
        i += 1;
      }
      parseColorBlock(body.slice(open + 1, i - 1), name, out);
      keyRe.lastIndex = i;
      continue;
    }

    const literal = /^\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/.exec(rest);
    if (!literal) continue;

    const value = literal[1] ?? literal[2] ?? literal[3];
    const finalName = key === "DEFAULT" && prefix ? prefix : name;
    if (value && isValidColor(value)) out[finalName] = toHex(value);
  }
};

interface ParsedClass {
  /** Variant chain: "" for base, "dark", "hover", "dark:hover", … */
  variant: string;
  /** The utility itself, e.g. `bg-red-500`. */
  utility: string;
  /** True for `bg-red-500/50` — a translucent layer, not a solid surface. */
  translucent: boolean;
}

/**
 * Split `dark:hover:bg-red-500/50` into its variant chain and utility.
 *
 * The variant matters: pairing a `dark:` text colour against a base background
 * invents a combination that never renders. The opacity suffix matters for the
 * same reason `color-mix` with `transparent` is skipped — what you'd actually
 * see depends on whatever is behind it, so there's no ratio to measure.
 */
const parseClass = (raw: string): ParsedClass | null => {
  const cleaned = raw.replace(/^!/, "").trim();
  if (!cleaned) return null;

  const lastColon = cleaned.lastIndexOf(":");
  const variant = lastColon === -1 ? "" : cleaned.slice(0, lastColon);
  const rest = lastColon === -1 ? cleaned : cleaned.slice(lastColon + 1);

  const translucent = /\/\d+$/.test(rest);
  return { variant, utility: rest.replace(/\/\d+$/, ""), translucent };
};

/**
 * `text-lg` is a size, `text-red-500` is a colour, and they share a prefix.
 * The size scale is a closed set, so checking against it resolves the ambiguity.
 */
const textSizeOf = (cls: string): number | null => {
  const m = /^text-(.+)$/.exec(cls);
  return m && m[1] in TEXT_SIZES ? TEXT_SIZES[m[1]] : null;
};

const colorClass = (cls: string, prefix: "text" | "bg"): string | null => {
  const m = new RegExp(`^${prefix}-(.+)$`).exec(cls);
  if (!m) return null;
  if (prefix === "text" && m[1] in TEXT_SIZES) return null;
  // Arbitrary values (`text-[#abc123]`) carry their own colour, not a token.
  if (m[1].startsWith("[")) return null;
  return m[1];
};

/** Every class-list literal in a source file, however it's written. */
export const extractClassLists = (source: string): string[] => {
  const lists: string[] = [];
  const patterns = [
    /\bclass(?:Name)?\s*=\s*"([^"]*)"/g,
    /\bclass(?:Name)?\s*=\s*'([^']*)'/g,
    /\bclass(?:Name)?\s*=\s*\{\s*`([^`]*)`\s*\}/g,
    /\bclass(?:Name)?\s*=\s*\{\s*"([^"]*)"\s*\}/g,
    /\bclass(?:Name)?\s*=\s*\{\s*'([^']*)'\s*\}/g,
  ];

  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) lists.push(m[1]);
  }
  return lists;
};

export interface ClassPairOptions {
  /** Source label used as the "selector" in the report. */
  label?: string;
}

/**
 * Derive pairings from Tailwind class lists.
 *
 * An element carrying both a text colour and a background colour is a confirmed
 * pairing — the same standard the CSS discovery uses. Elements with only a text
 * colour are skipped rather than guessed at: in Tailwind the surface usually
 * comes from an ancestor in the markup, which a per-element scan can't see, and
 * inventing a background would produce failures nobody can act on.
 */
export const discoverClassPairs = (
  source: string,
  { label = "class" }: ClassPairOptions = {},
): DiscoveredPair[] => {
  const pairs: DiscoveredPair[] = [];
  const seen = new Set<string>();

  for (const list of extractClassLists(source)) {
    // A `${…}` in the class string means classes come from branches that may
    // never apply together. The pairing is plausible, not proven, so it warns
    // rather than gates — same standard as an inferred CSS surface.
    const interpolated = /\$\{|\{\{/.test(list);

    // Inside `${cond ? 'bg-x' : ''}` the class is wrapped in quotes and sits
    // next to expression syntax. Blanking those characters exposes the class
    // names without needing to parse the expression — `:` `/` `[` `#` `-` are
    // kept because Tailwind uses them (`dark:`, `/50`, `text-[#abc]`).
    const parsed = list
      .replace(/[`'"{}(),?]/g, " ")
      .split(/\s+/)
      .map(parseClass)
      .filter((c): c is ParsedClass => c !== null);

    // Base-layer values, used as the fallback for every variant: `hover:bg-x`
    // changes only the background, so it still pairs with the base text colour.
    let baseFg: string | null = null;
    let baseBg: string | null = null;
    let basePx: number | null = null;
    let baseBold = false;

    for (const c of parsed) {
      if (c.variant) continue;
      const size = textSizeOf(c.utility);
      if (size !== null) {
        basePx = size;
        continue;
      }
      if (BOLD.has(c.utility)) baseBold = true;
      if (!c.translucent) {
        baseFg = baseFg ?? colorClass(c.utility, "text");
        baseBg = baseBg ?? colorClass(c.utility, "bg");
      }
    }

    // One candidate pairing per variant present on the element.
    const variants = new Set(parsed.map((c) => c.variant));

    for (const variant of variants) {
      let fg: string | null = null;
      let bg: string | null = null;
      let px = basePx;
      let bold = baseBold;
      // The variant sets a background we can't measure (e.g. `dark:bg-x/30`).
      // Knowing a surface exists but not what it is means no fallback is valid.
      let translucentBg = false;

      for (const c of parsed) {
        if (c.variant !== variant) continue;
        const size = textSizeOf(c.utility);
        if (size !== null) {
          px = size;
          continue;
        }
        if (BOLD.has(c.utility)) bold = true;
        if (c.translucent) {
          if (colorClass(c.utility, "bg")) translucentBg = true;
          continue;
        }
        fg = fg ?? colorClass(c.utility, "text");
        bg = bg ?? colorClass(c.utility, "bg");
      }

      if (translucentBg && !bg) continue;

      const foreground = fg ?? (variant ? baseFg : null);
      // A theme variant only pairs against a background it declares itself.
      const background = bg ?? (variant && !isThemeVariant(variant) ? baseBg : null);
      if (!foreground || !background || foreground === background) continue;

      // Only report a variant pairing when that variant contributed a colour —
      // otherwise every variant would restate the base pairing.
      if (variant && !fg && !bg) continue;

      const large = px !== null && (px >= 24 || (bold && px >= 18.66));
      const key = `${foreground}|${background}|${large}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const where = variant ? `${label} (${variant})` : label;
      pairs.push({
        foreground,
        background,
        selector: `${where}: ${list.trim().replace(/\s+/g, " ").slice(0, 48)}`,
        large,
        origin: interpolated ? "implied" : "rule",
      });
    }
  }

  return pairs;
};
