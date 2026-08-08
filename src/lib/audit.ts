import { contrastRatio, contrastRating, readableTextColor } from "./color.js";
import type { AuditResult, AuditRow, ColorKey, Palette } from "./types.js";

/**
 * The pairings the preview actually renders.
 *
 * Deliberately not a 5x5 matrix: most of those cells never touch each other on
 * screen, and the noise would bury the handful that matter.
 *
 * `derived` marks a foreground the app computes rather than takes from the
 * palette — primary buttons pick their label colour with `readableTextColor`, so
 * grading `background`-on-`primary` here would report a failure the user can
 * never see and can't fix.
 */
export const AUDIT_PAIRS: Array<{
  label: string;
  foreground: ColorKey;
  background: ColorKey;
  large: boolean;
  derived?: boolean;
  /** Plain language: what this pairing is, and what breaks when it fails. */
  why: string;
}> = [
  {
    label: "Body text",
    foreground: "text",
    background: "background",
    large: false,
    why: "Paragraph copy on the page background. The most important row here — if this fails, everything is a strain to read, and it's the pairing that appears on every screen.",
  },
  {
    label: "Headings",
    foreground: "primary",
    background: "background",
    large: true,
    why: "Headings are drawn in your primary colour. They're large, so they only need 3:1 — but below that they stop reading as text and start reading as decoration.",
  },
  {
    label: "Button label",
    foreground: "background",
    background: "primary",
    large: false,
    derived: true,
    why: "Text on a primary button. Theme Lab picks this label colour for you, so it's usually safe — a failure here means the primary itself sits in an awkward middle range.",
  },
  {
    label: "Accent on bg",
    foreground: "accent",
    background: "background",
    large: true,
    why: "Accent used as text — badges, links, small highlights. Bright accents on light backgrounds are the single most common way a nice-looking palette fails.",
  },
  {
    label: "Secondary on bg",
    foreground: "secondary",
    background: "background",
    large: true,
    why: "Secondary carries muted labels, captions and metadata. It's meant to recede, and it's easy to push it so far back that it disappears.",
  },
];

/**
 * Grade a palette against WCAG 2.1.
 *
 * One implementation shared by the sidebar panel, the `theme-lab check` CLI and
 * the MCP server, so a palette can't pass in one place and fail in another.
 */
export const auditPalette = (colors: Palette): AuditResult => {
  const rows: AuditRow[] = AUDIT_PAIRS.map((pair) => {
    const background = colors[pair.background];
    // Match what the DOM paints: derived foregrounds come from --on-primary /
    // --on-accent, not from the palette slot.
    const foreground = pair.derived ? readableTextColor(background) : colors[pair.foreground];
    const ratio = contrastRatio(foreground, background);

    return {
      label: pair.label,
      foreground: pair.foreground,
      background: pair.background,
      large: pair.large,
      derived: pair.derived ?? false,
      why: pair.why,
      resolvedForeground: foreground,
      ratio,
      rating: contrastRating(ratio, pair.large),
    };
  });

  const failures = rows.filter((r) => !r.rating.pass);
  return { rows, failures, passed: failures.length === 0 };
};
