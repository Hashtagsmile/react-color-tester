import chroma from "chroma-js";
import { readableTextColor } from "./color.js";
import { COLOR_KEYS } from "./types.js";
import type { Fonts, LockMap, Palette, Theme } from "./types.js";

export { COLOR_KEYS };
export type { ColorKey, Fonts, LockMap, Palette, Theme } from "./types.js";

export const DEFAULT_FONTS: Fonts = { header: "Poppins", body: "Inter" };

/**
 * Derive a light or dark variant from a set of source colours.
 *
 * Every contrast-correction loop is bounded (`guard`) so a colour that can never
 * reach the target ratio — because it clamps at pure black or white — can't hang
 * the tab. The original implementation used an unbounded `while` here.
 */
export const generateVariant = (colors: Palette, dark: boolean): Palette => {
  const clampContrast = (color: string, background: string, min = 3, hueShift = 0): string => {
    let c = chroma(color);
    c = dark ? c.darken(1.2).desaturate(0.3) : c.brighten(1.2).saturate(0.4);
    if (hueShift) c = c.set("hsl.h", `+${hueShift}`);

    let guard = 0;
    while (chroma.contrast(c, background) < min && guard < 24) {
      c = dark ? c.brighten(0.4) : c.darken(0.4);
      guard += 1;
    }
    return c.hex();
  };

  const background = dark
    ? chroma(colors.primary).darken(3.4).desaturate(0.6).hex()
    : chroma(colors.primary).brighten(3.4).saturate(0.5).hex();

  return {
    primary: colors.primary,
    secondary: clampContrast(colors.secondary, background, 3, 18),
    accent: clampContrast(colors.accent, background, 3, 30),
    background,
    text: dark
      ? chroma(colors.primary).brighten(3).desaturate(0.4).hex()
      : chroma(colors.primary).darken(3).desaturate(0.6).hex(),
  };
};

/**
 * Randomise from a single base hue rather than five independent randoms —
 * independent picks essentially never look like a palette. Locked slots pass through.
 */
export const randomColors = (locked: LockMap, current: Palette, dark: boolean): Palette => {
  const base = chroma.random();
  const scale = chroma.scale([base, base.set("hsl.h", "+120")]);
  const keep = (key: keyof Palette, value: string) => (locked[key] ? current[key] : value);

  const background = dark
    ? chroma(base).darken(2).desaturate(0.5).hex()
    : chroma(base).brighten(2.4).saturate(0.3).hex();

  return {
    primary: keep("primary", scale(0.3).hex()),
    secondary: keep("secondary", scale(0.55).hex()),
    accent: keep("accent", base.set("hsl.h", "+60").hex()),
    background: keep("background", background),
    text: keep("text", readableTextColor(background)),
  };
};

export const randomFonts = (fontList: string[]): Fonts => {
  const pick = () => fontList[Math.floor(Math.random() * fontList.length)];
  return { header: pick(), body: pick() };
};

/* ------------------------------------------------------------------ */
/*  Shareable-URL encoding                                            */
/* ------------------------------------------------------------------ */

interface EncodedPayload {
  c: string[];
  f: [string, string];
  d: 0 | 1;
}

/**
 * Compact, URL-safe base64 of the essential theme data. Stripping `#`, using
 * single-letter keys and URL-safe base64 keeps a full theme near 120 characters —
 * short enough to paste into Slack without wrapping.
 */
export const encodeTheme = (colors: Palette, fonts: Fonts, isDarkMode: boolean): string => {
  const payload: EncodedPayload = {
    c: COLOR_KEYS.map((k) => (colors[k] || "#000000").replace("#", "")),
    f: [fonts.header, fonts.body],
    d: isDarkMode ? 1 : 0,
  };
  return btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

/** Inverse of `encodeTheme`. Returns null on anything malformed rather than throwing. */
export const decodeTheme = (str: string): Theme | null => {
  try {
    const json = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
    const p = JSON.parse(json) as Partial<EncodedPayload>;
    if (!Array.isArray(p.c) || p.c.length !== COLOR_KEYS.length) return null;

    const colors = {} as Palette;
    COLOR_KEYS.forEach((k, i) => {
      colors[k] = `#${p.c![i]}`;
    });

    return {
      colors,
      fonts: {
        header: p.f?.[0] || DEFAULT_FONTS.header,
        body: p.f?.[1] || DEFAULT_FONTS.body,
      },
      isDarkMode: !!p.d,
    };
  } catch {
    return null;
  }
};
