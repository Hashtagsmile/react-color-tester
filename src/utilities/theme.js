import chroma from "chroma-js";
import { readableTextColor } from "./utilities";
import { predefinedFonts } from "../data/predefinedThemes";

export const COLOR_KEYS = ["primary", "secondary", "accent", "background", "text"];

export const DEFAULT_FONTS = { header: "Poppins", body: "Inter" };

// Two independent random picks from the curated font list.
export const randomFonts = () => {
  const pick = () => predefinedFonts[Math.floor(Math.random() * predefinedFonts.length)];
  return { header: pick(), body: pick() };
};

/**
 * Derive a light or dark variant from a set of "source" colors.
 *
 * Every contrast-correction loop is bounded (`guard`) so a color that can never
 * reach the target ratio (e.g. it clamps to pure black/white) can't hang the tab
 * — the original implementation had an unbounded `while` here.
 */
export const generateVariant = (colors, dark) => {
  const clampContrast = (color, background, min = 3, hueShift = 0) => {
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

// Randomise colors from one harmonious base hue, preserving any locked slots.
export const randomColors = (locked, current, dark) => {
  const base = chroma.random();
  const scale = chroma.scale([base, base.set("hsl.h", "+120")]);
  const keep = (key, value) => (locked[key] ? current[key] : value);

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

/* ------------------------------------------------------------------ */
/*  Shareable-URL encoding                                            */
/* ------------------------------------------------------------------ */

// Compact, URL-safe base64 of the essential theme data.
export const encodeTheme = (colors, fonts, isDarkMode) => {
  const payload = {
    c: COLOR_KEYS.map((k) => (colors[k] || "#000000").replace("#", "")),
    f: [fonts.header, fonts.body],
    d: isDarkMode ? 1 : 0,
  };
  return btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const decodeTheme = (str) => {
  try {
    const json = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
    const p = JSON.parse(json);
    if (!Array.isArray(p.c) || p.c.length !== COLOR_KEYS.length) return null;

    const colors = {};
    COLOR_KEYS.forEach((k, i) => {
      colors[k] = `#${p.c[i]}`;
    });

    return {
      colors,
      fonts: { header: p.f?.[0] || DEFAULT_FONTS.header, body: p.f?.[1] || DEFAULT_FONTS.body },
      isDarkMode: !!p.d,
    };
  } catch {
    return null;
  }
};
