import { isValidColor, toHex } from "./color.js";
import { parseRules, soleVarName } from "./discover.js";
import type { CssRule, DiscoveredPair, TokenMap } from "./discover.js";

/**
 * CSS-in-JS discovery.
 *
 * styled-components, Emotion, vanilla-extract and inline `style` objects all
 * express the same thing the CSS discovery already understands — a text colour
 * and a background applied to one element — just in JavaScript syntax.
 *
 * The values are usually hex literals rather than tokens, so literals become
 * their own token name (`#6366f1 on #ffffff`). That keeps the report readable
 * and the audit uniform, without pretending a literal is a named token.
 */

export interface StyleScan {
  pairs: DiscoveredPair[];
  /** Literal colours found, keyed by themselves so the audit can resolve them. */
  tokens: TokenMap;
}

/** camelCase → kebab-case, so JS style objects match CSS property names. */
const kebab = (prop: string): string => prop.replace(/([A-Z])/g, "-$1").toLowerCase();

/**
 * Tagged template literals that contain CSS.
 *
 * `styled.button`, `styled(Link)`, `css`, `createGlobalStyle`, `keyframes` —
 * plus Emotion's `styled.div` under a different import. Matching the tag rather
 * than the import keeps this independent of how the library was brought in.
 */
const TEMPLATE_TAG =
  /(?:styled(?:\.\w+|\([^)]*\))|css|createGlobalStyle|injectGlobal)\s*(?:<[^>]*>)?\s*`/g;

/** Read a template literal's body, respecting nested `${…}` braces. */
const readTemplate = (source: string, start: number): { body: string; end: number } => {
  let i = start;
  let body = "";

  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") {
      body += source.slice(i, i + 2);
      i += 2;
      continue;
    }
    if (ch === "`") break;
    if (ch === "$" && source[i + 1] === "{") {
      // Skip the expression entirely — a declaration that depends on it can't
      // be resolved to a colour anyway, and its braces would break the scanner.
      let depth = 1;
      let j = i + 2;
      while (j < source.length && depth > 0) {
        if (source[j] === "{") depth += 1;
        else if (source[j] === "}") depth -= 1;
        j += 1;
      }
      body += "__EXPR__";
      i = j;
      continue;
    }
    body += ch;
    i += 1;
  }

  return { body, end: i + 1 };
};

/** Every CSS-ish template literal body in a source file. */
export const extractStyleTemplates = (source: string): string[] => {
  const out: string[] = [];
  TEMPLATE_TAG.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TEMPLATE_TAG.exec(source)) !== null) {
    const { body, end } = readTemplate(source, match.index + match[0].length);
    out.push(body);
    TEMPLATE_TAG.lastIndex = end;
  }
  return out;
};

/**
 * Style objects: `style({ color: "#fff", backgroundColor: "#000" })`, inline
 * `style={{ … }}`, and vanilla-extract's `style()`.
 *
 * Deliberately shallow — one object literal's own properties. Nested selectors
 * inside vanilla-extract are a different shape and reading them wrongly would
 * pair colours that never meet.
 */
export const extractStyleObjects = (source: string): Array<Record<string, string>> => {
  const out: Array<Record<string, string>> = [];
  const re = /\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(source)) !== null) {
    const body = match[1];
    if (!/\bcolor\b|\bbackground/i.test(body)) continue;

    const props: Record<string, string> = {};
    const propRe = /(?:"([^"]+)"|'([^']+)'|([A-Za-z_$][\w$]*))\s*:\s*(?:"([^"]*)"|'([^']*)')/g;
    let prop: RegExpExecArray | null;

    while ((prop = propRe.exec(body)) !== null) {
      const key = prop[1] ?? prop[2] ?? prop[3];
      const value = prop[4] ?? prop[5];
      if (key && value !== undefined) props[kebab(key)] = value;
    }

    if (Object.keys(props).length) out.push(props);
  }
  return out;
};

/** Resolve a declaration value to a token name, or a literal hex as itself. */
const colorRef = (value: string | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim().replace(/\s*!important$/, "");
  if (trimmed.includes("__EXPR__")) return null;

  const token = soleVarName(trimmed);
  if (token) return token;

  return isValidColor(trimmed) ? toHex(trimmed) : null;
};

const FG = ["color"];
const BG = ["background-color", "background"];

const pick = (get: (prop: string) => string | undefined, props: string[]): string | null => {
  for (const prop of props) {
    const ref = colorRef(get(prop));
    if (ref) return ref;
  }
  return null;
};

/** WCAG's large-text threshold from a declaration set. */
const isLarge = (get: (prop: string) => string | undefined): boolean => {
  const size = get("font-size");
  if (!size) return false;
  const m = /^(-?[\d.]+)(px|rem|em|pt)?$/.exec(size.trim());
  if (!m) return false;
  const n = parseFloat(m[1]);
  const px = m[2] === "rem" || m[2] === "em" ? n * 16 : m[2] === "pt" ? n * (96 / 72) : n;

  const weight = get("font-weight") ?? "";
  const numeric = parseInt(weight, 10);
  const bold = weight === "bold" || (!Number.isNaN(numeric) && numeric >= 700);

  return px >= 24 || (bold && px >= 18.66);
};

/**
 * Derive pairings from a file's CSS-in-JS.
 *
 * Same standard as everywhere else: one declaration set carrying both a text
 * colour and a background is a confirmed pairing. A lone text colour is left
 * alone — in CSS-in-JS the surface almost always comes from a different
 * component, and guessing would manufacture failures nobody can act on.
 */
export const discoverStylePairs = (source: string, label = "styles"): StyleScan => {
  const pairs: DiscoveredPair[] = [];
  const tokens: TokenMap = {};
  const seen = new Set<string>();

  const add = (
    foreground: string,
    background: string,
    large: boolean,
    selector: string,
  ): void => {
    if (foreground === background) return;
    const key = `${foreground}|${background}|${large}`;
    if (seen.has(key)) return;
    seen.add(key);

    // A literal is its own token, so the audit can resolve it.
    for (const ref of [foreground, background]) {
      if (ref.startsWith("#")) tokens[ref] = ref;
    }
    pairs.push({ foreground, background, selector, large, origin: "rule" });
  };

  const fromRule = (rule: CssRule, selector: string) => {
    const get = (prop: string) => rule.declarations.get(prop);
    const fg = pick(get, FG);
    const bg = pick(get, BG);
    if (fg && bg) add(fg, bg, isLarge(get), selector);
  };

  for (const [i, body] of extractStyleTemplates(source).entries()) {
    // A styled template's declarations sit at the top level with no selector,
    // so wrap them before parsing. Nested rules inside come through too.
    for (const rule of parseRules(`__root__ { ${body} }`)) {
      fromRule(rule, `${label}: styled #${i + 1}`);
    }
  }

  for (const [i, props] of extractStyleObjects(source).entries()) {
    const get = (prop: string) => props[prop];
    const fg = pick(get, FG);
    const bg = pick(get, BG);
    if (fg && bg) add(fg, bg, isLarge(get), `${label}: style object #${i + 1}`);
  }

  return { pairs, tokens };
};
