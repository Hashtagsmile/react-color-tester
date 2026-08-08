import chroma from "chroma-js";
import type { ColorFormat, ContrastRating } from "./types.js";

/**
 * Colour helpers.
 *
 * Everything funnels through chroma-js so any input the browser or a saved theme
 * can hand us (hex, rgb(), rgba(), hsl(), named colours) normalises into a
 * predictable shape. An earlier implementation assumed rgba() strings and broke
 * silently on the hex values coming out of `getComputedStyle`.
 *
 * This module is browser-free on purpose: the CLI and the MCP server import it.
 */

/** Normalise any valid CSS colour into a #rrggbb hex string. */
export const toHex = (color: string, fallback = "#000000"): string => {
  try {
    return chroma(color).hex();
  } catch {
    return fallback;
  }
};

export const isValidColor = (color: string): boolean => chroma.valid(color);

/** Perceived-lightness check, used to pick a readable text colour over a swatch. */
export const isColorLight = (color: string): boolean => {
  if (!chroma.valid(color)) return false;
  return chroma(color).luminance() > 0.4;
};

/** Whichever of black / white reads best on top of `background`. */
export const readableTextColor = (background: string): string => {
  if (!chroma.valid(background)) return "#000000";
  return chroma.contrast(background, "#ffffff") >= chroma.contrast(background, "#000000")
    ? "#ffffff"
    : "#000000";
};

/** WCAG 2.1 contrast ratio between two colours (1–21). 0 for invalid input. */
export const contrastRatio = (a: string, b: string): number => {
  if (!chroma.valid(a) || !chroma.valid(b)) return 0;
  return chroma.contrast(a, b);
};

/**
 * Grade a ratio against the WCAG 2.1 thresholds.
 * `large` = text at least 18.66px bold or 24px regular, which only needs 3:1.
 */
export const contrastRating = (ratio: number, large = false): ContrastRating => {
  if (large) {
    if (ratio >= 4.5) return { label: "AAA", pass: true, level: "aaa" };
    if (ratio >= 3) return { label: "AA", pass: true, level: "aa" };
    return { label: "Fail", pass: false, level: "fail" };
  }
  if (ratio >= 7) return { label: "AAA", pass: true, level: "aaa" };
  if (ratio >= 4.5) return { label: "AA", pass: true, level: "aa" };
  // Big enough for large text only — still a fail for the body copy it was measured as.
  if (ratio >= 3) return { label: "AA Large", pass: false, level: "aa-large" };
  return { label: "Fail", pass: false, level: "fail" };
};

export const formatColor = (color: string, format: ColorFormat = "HEX"): string => {
  if (!chroma.valid(color)) return color;
  const c = chroma(color);
  switch (format) {
    case "RGB":
      return c.css("rgb");
    case "HSL":
      return c.css("hsl");
    default:
      return c.hex();
  }
};
