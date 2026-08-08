import { isValidColor, toHex } from "./color.js";
import { DEFAULT_FONTS } from "./theme.js";
import { COLOR_KEYS } from "./types.js";
import type { ColorKey, Fonts, Palette } from "./types.js";

/**
 * Parse a palette out of whatever an AI assistant just handed you.
 *
 * This is the point of the tool in 2026: generating a palette is free, checking
 * whether it survives contact with real UI is not. So the parser is deliberately
 * forgiving — it accepts CSS custom properties, a Tailwind config, or plain JSON,
 * in any of the naming conventions those tend to come back in.
 */

export interface ParseResult {
  ok: boolean;
  colors?: Palette;
  fonts?: Fonts;
  /** Which roles were found, so the UI can say what it had to fall back on. */
  matched: ColorKey[];
  missing: ColorKey[];
  source?: "css" | "tailwind" | "json";
  error?: string;
}

/**
 * Names seen in the wild for each role, longest-first so `background` wins over
 * `bg` and we don't match `--color-primary-foreground` as `primary`.
 */
const ROLE_ALIASES: Record<ColorKey, string[]> = {
  primary: ["primary", "brand", "accent-primary", "main"],
  secondary: ["secondary", "muted", "subtle"],
  accent: ["accent", "highlight", "tertiary"],
  background: ["background", "bg", "surface", "base", "canvas"],
  text: ["text", "foreground", "fg", "copy", "ink", "on-background"],
};

const FONT_ALIASES = {
  header: ["heading", "header", "display", "title", "sans-heading"],
  body: ["body", "text", "sans", "base"],
};

/** Strip the decoration around a token name: `--color-primary-500` → `primary`. */
const normaliseKey = (raw: string): string =>
  raw
    .trim()
    .replace(/^--/, "")
    .replace(/^(color|colour|theme|token|c)[-_.]/, "")
    .replace(/[-_.](50|100|200|300|400|500|600|700|800|900|950|default|base)$/, "")
    .replace(/[\s_.]+/g, "-")
    .toLowerCase();

const matchRole = (key: string): ColorKey | null => {
  const k = normaliseKey(key);
  for (const role of COLOR_KEYS) {
    if (ROLE_ALIASES[role].includes(k)) return role;
  }
  return null;
};

/** Pull every `name: value` pair out of CSS custom properties or a JS/JSON object. */
const collectPairs = (input: string): Array<[string, string]> => {
  const pairs: Array<[string, string]> = [];

  // --name: value;  |  "name": "value"  |  name: "value"
  // The `fn(...)` branch has to come before the bare one, otherwise the comma in
  // `rgb(79, 70, 229)` ends the match and leaves `rgb(79`.
  const re =
    /(--[\w-]+|"[^"]+"|'[^']+'|[\w-]+)\s*:\s*("[^"]*"|'[^']*'|[a-zA-Z-]+\([^)]*\)|[^;,{}\n]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    const key = m[1].replace(/^["']|["']$/g, "");
    const value = m[2].trim().replace(/^["']|["']$/g, "").replace(/,$/, "").trim();
    if (key && value) pairs.push([key, value]);
  }
  return pairs;
};

const detectSource = (input: string): ParseResult["source"] => {
  if (/--[\w-]+\s*:/.test(input)) return "css";
  if (/tailwind|theme\s*:|extend\s*:/i.test(input)) return "tailwind";
  return "json";
};

const extractFonts = (pairs: Array<[string, string]>): Fonts => {
  const fonts: Fonts = { ...DEFAULT_FONTS };

  for (const [rawKey, rawValue] of pairs) {
    const key = normaliseKey(rawKey).replace(/^font[-_.]?/, "").replace(/[-_.]?family$/, "");
    // Take the first family off a stack and drop any quoting: `"Inter", sans-serif` → Inter
    const first = rawValue.split(",")[0].replace(/^\[/, "").replace(/["'\]]/g, "").trim();
    if (!first || isValidColor(first)) continue;

    if (FONT_ALIASES.header.includes(key)) fonts.header = first;
    else if (FONT_ALIASES.body.includes(key)) fonts.body = first;
  }
  return fonts;
};

/**
 * Best-effort parse. Roles that aren't found are reported in `missing` so the
 * caller can decide whether to fill them from the current theme rather than
 * silently inventing colours.
 */
export const parseTheme = (input: string): ParseResult => {
  if (!input || !input.trim()) {
    return { ok: false, matched: [], missing: [...COLOR_KEYS], error: "Nothing to import." };
  }

  const pairs = collectPairs(input);
  if (!pairs.length) {
    return {
      ok: false,
      matched: [],
      missing: [...COLOR_KEYS],
      error: "Couldn't find any `name: value` pairs. Paste CSS variables, a Tailwind config, or JSON.",
    };
  }

  const found = {} as Partial<Palette>;
  for (const [rawKey, rawValue] of pairs) {
    const role = matchRole(rawKey);
    // First match wins: light scales are conventionally declared before dark overrides.
    if (!role || found[role]) continue;
    if (!isValidColor(rawValue)) continue;
    found[role] = toHex(rawValue);
  }

  const matched = COLOR_KEYS.filter((k) => found[k]);
  const missing = COLOR_KEYS.filter((k) => !found[k]);

  if (!matched.length) {
    return {
      ok: false,
      matched,
      missing,
      error: "Found values, but none looked like a colour role (primary, background, text, …).",
    };
  }

  return {
    ok: true,
    colors: found as Palette,
    fonts: extractFonts(pairs),
    matched,
    missing,
    source: detectSource(input),
  };
};
