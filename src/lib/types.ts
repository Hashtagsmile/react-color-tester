/**
 * The shapes the whole app agrees on.
 *
 * A theme is deliberately small: five colour roles and two font slots. Everything
 * else (presets, locks, history, exports) is expressed in terms of these.
 */

export const COLOR_KEYS = ["primary", "secondary", "accent", "background", "text"] as const;

export type ColorKey = (typeof COLOR_KEYS)[number];

/** A complete five-role palette. Every key is required — a partial palette is a bug. */
export type Palette = Record<ColorKey, string>;

export interface Fonts {
  header: string;
  body: string;
}

/** Which swatches survive a randomize. */
export type LockMap = Record<ColorKey, boolean>;

export interface Theme {
  colors: Palette;
  fonts: Fonts;
  isDarkMode: boolean;
}

export type ContrastLevel = "aaa" | "aa" | "aa-large" | "fail";

export interface ContrastRating {
  label: string;
  pass: boolean;
  level: ContrastLevel;
}

export type ColorFormat = "HEX" | "RGB" | "HSL";

export type ExportFormat = "CSS" | "Tailwind" | "JSON" | "AI";

export interface ExportOptions {
  colorFormat: ColorFormat;
  /** Emit both light and dark scales rather than just the current mode. */
  bothModes: boolean;
  current: Palette;
}

/** One row of a contrast audit — a pairing the UI actually renders. */
export interface AuditRow {
  label: string;
  foreground: ColorKey;
  background: ColorKey;
  /** WCAG treats large text more leniently (3:1 rather than 4.5:1). */
  large: boolean;
  /** True when the app computes this foreground rather than using the palette slot. */
  derived: boolean;
  /** Plain language: what this pairing is, and what breaks when it fails. */
  why: string;
  /** The colour actually measured — differs from `colors[foreground]` when derived. */
  resolvedForeground: string;
  ratio: number;
  rating: ContrastRating;
}

export interface AuditResult {
  rows: AuditRow[];
  /** Rows that fail their WCAG threshold. Empty means the palette passes. */
  failures: AuditRow[];
  passed: boolean;
}
