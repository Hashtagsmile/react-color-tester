import { describe, expect, it } from "vitest";
import { auditPalette } from "../src/lib/audit";
import { predefinedThemes } from "../src/data/predefinedThemes";
import { COLOR_KEYS } from "../src/lib/types";
import type { Palette } from "../src/lib/types";

/**
 * A tool that grades other people's palettes has to pass its own grader.
 *
 * When this was first written, 9 of 11 light presets failed — including the one
 * called "High Contrast", whose amber accent sat at 1.92:1 on white.
 */
describe("bundled presets", () => {
  const variants = predefinedThemes.flatMap((theme) => [
    { name: `${theme.name} (light)`, palette: theme.light },
    { name: `${theme.name} (dark)`, palette: theme.dark },
  ]);

  it("every preset variant passes WCAG", () => {
    const broken = variants
      .map(({ name, palette }) => ({ name, result: auditPalette(palette) }))
      .filter(({ result }) => !result.passed)
      .map(
        ({ name, result }) =>
          `${name}: ${result.failures
            .map((f) => `${f.label} ${f.ratio.toFixed(2)}:1`)
            .join(", ")}`,
      );

    expect(broken, `failing presets:\n${broken.join("\n")}`).toEqual([]);
  });

  it("every preset variant defines all five roles as valid hex", () => {
    for (const { name, palette } of variants) {
      for (const key of COLOR_KEYS) {
        expect(palette[key], `${name} → ${key}`).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it("ships a light and dark variant for every preset", () => {
    for (const theme of predefinedThemes) {
      expect(theme.light).toBeTruthy();
      expect(theme.dark).toBeTruthy();
      expect(theme.headerFont).toBeTruthy();
      expect(theme.bodyFont).toBeTruthy();
    }
  });
});

describe("audit honesty", () => {
  it("grades the button label against the colour the app actually derives", () => {
    // background-on-primary would report a failure the user can neither see nor
    // fix, because primary buttons pick their label with readableTextColor.
    const palette: Palette = {
      primary: "#059669",
      secondary: "#0d9488",
      accent: "#bb6e00",
      background: "#f8fafc",
      text: "#064e3b",
    };
    const row = auditPalette(palette).rows.find((r) => r.label === "Button label")!;

    expect(row.derived).toBe(true);
    expect(row.resolvedForeground).toMatch(/^#(ffffff|000000)$/);
    expect(row.resolvedForeground).not.toBe(palette.background);
    expect(row.rating.pass).toBe(true);
  });

  it("still grades non-derived rows straight from the palette", () => {
    const palette: Palette = {
      primary: "#3730a3",
      secondary: "#475569",
      accent: "#b45309",
      background: "#ffffff",
      text: "#0f172a",
    };
    const row = auditPalette(palette).rows.find((r) => r.label === "Body text")!;
    expect(row.derived).toBe(false);
    expect(row.resolvedForeground).toBe(palette.text);
  });
});
