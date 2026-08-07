import chroma from "chroma-js";

/**
 * Color helpers for Theme Lab.
 *
 * Everything funnels through chroma-js so that any input the browser or a saved
 * theme can hand us (hex, rgb(), rgba(), hsl(), named colors) is normalised into
 * a predictable shape. The old implementation assumed rgba() strings and silently
 * broke on hex values coming out of `getComputedStyle`.
 */

// Normalise any valid CSS color into a #rrggbb hex string.
export const toHex = (color, fallback = "#000000") => {
  try {
    return chroma(color).hex();
  } catch {
    return fallback;
  }
};

// Kept for backwards compatibility – now just delegates to chroma.
export const rgbaToHex = (rgba) => toHex(rgba, rgba);

// Read a CSS custom property off :root and return it as hex.
export const getCSSVariableValue = (variable) => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return toHex(value, "#000000");
};

// Perceived-lightness check (used to pick readable text over a swatch).
export const isColorLight = (color) => {
  if (!chroma.valid(color)) return false;
  return chroma(color).luminance() > 0.4;
};

// Return whichever of black / white reads best on top of `background`.
export const readableTextColor = (background) => {
  if (!chroma.valid(background)) return "#000000";
  return chroma.contrast(background, "#ffffff") >= chroma.contrast(background, "#000000")
    ? "#ffffff"
    : "#000000";
};

/* ------------------------------------------------------------------ */
/*  WCAG contrast                                                      */
/* ------------------------------------------------------------------ */

// WCAG 2.1 contrast ratio between two colors (1–21).
export const contrastRatio = (a, b) => {
  if (!chroma.valid(a) || !chroma.valid(b)) return 0;
  return chroma.contrast(a, b);
};

// Grade a contrast ratio against WCAG AA / AAA thresholds.
// `large` = text ≥ 18.66px bold or ≥ 24px.
export const contrastRating = (ratio, large = false) => {
  if (large) {
    if (ratio >= 4.5) return { label: "AAA", pass: true, level: "aaa" };
    if (ratio >= 3) return { label: "AA", pass: true, level: "aa" };
    return { label: "Fail", pass: false, level: "fail" };
  }
  if (ratio >= 7) return { label: "AAA", pass: true, level: "aaa" };
  if (ratio >= 4.5) return { label: "AA", pass: true, level: "aa" };
  if (ratio >= 3) return { label: "AA Large", pass: false, level: "aa-large" };
  return { label: "Fail", pass: false, level: "fail" };
};

/* ------------------------------------------------------------------ */
/*  Format conversion (for the export panel)                          */
/* ------------------------------------------------------------------ */

export const formatColor = (color, format = "HEX") => {
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
