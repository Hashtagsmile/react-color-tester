import { describe, expect, it } from "vitest";
import {
  contrastRating,
  contrastRatio,
  formatColor,
  isColorLight,
  readableTextColor,
  toHex,
} from "../src/lib/color";
import { auditPalette } from "../src/lib/audit";
import type { Palette } from "../src/lib/types";

describe("contrastRatio", () => {
  // Anchored to the WCAG 2.1 definition rather than to our own output.
  it("matches known reference values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 1);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#4f46e5", "#ffffff")).toBeCloseTo(
      contrastRatio("#ffffff", "#4f46e5"),
      10,
    );
  });

  it("returns 0 for invalid input rather than throwing", () => {
    expect(contrastRatio("not-a-color", "#fff")).toBe(0);
    expect(contrastRatio("#fff", "")).toBe(0);
  });
});

describe("contrastRating", () => {
  it("grades normal text on the 4.5 / 7 thresholds", () => {
    expect(contrastRating(21).level).toBe("aaa");
    expect(contrastRating(7).level).toBe("aaa");
    expect(contrastRating(6.99).level).toBe("aa");
    expect(contrastRating(4.5).level).toBe("aa");
    expect(contrastRating(4.49).level).toBe("aa-large");
    expect(contrastRating(2.99).level).toBe("fail");
  });

  it("grades large text on the 3 / 4.5 thresholds", () => {
    expect(contrastRating(4.5, true).level).toBe("aaa");
    expect(contrastRating(3, true).level).toBe("aa");
    expect(contrastRating(2.99, true).level).toBe("fail");
  });

  it("does not mark 'AA Large' as a pass when measured as body text", () => {
    // 3:1 is fine for a heading and not fine for body copy — the row was measured
    // as body copy, so it has to report a failure.
    const rating = contrastRating(3.5, false);
    expect(rating.label).toBe("AA Large");
    expect(rating.pass).toBe(false);
  });
});

describe("readableTextColor", () => {
  it("picks white on dark and black on light", () => {
    expect(readableTextColor("#000000")).toBe("#ffffff");
    expect(readableTextColor("#ffffff")).toBe("#000000");
    expect(readableTextColor("#0f172a")).toBe("#ffffff");
    expect(readableTextColor("#dffcfb")).toBe("#000000");
  });

  it("always returns the higher-contrast option", () => {
    for (const bg of ["#4f46e5", "#f59e0b", "#64748b", "#7c9ec4", "#808080"]) {
      const chosen = readableTextColor(bg);
      const other = chosen === "#ffffff" ? "#000000" : "#ffffff";
      expect(contrastRatio(bg, chosen)).toBeGreaterThanOrEqual(contrastRatio(bg, other));
    }
  });

  it("degrades safely on invalid input", () => {
    expect(readableTextColor("nonsense")).toBe("#000000");
  });
});

describe("toHex / isColorLight / formatColor", () => {
  it("normalises any CSS colour notation to hex", () => {
    expect(toHex("rgb(255, 255, 255)")).toBe("#ffffff");
    expect(toHex("#FFF")).toBe("#ffffff");
    expect(toHex("white")).toBe("#ffffff");
    expect(toHex("hsl(0, 0%, 0%)")).toBe("#000000");
  });

  it("returns the fallback for junk", () => {
    expect(toHex("nope", "#123456")).toBe("#123456");
  });

  it("classifies light and dark", () => {
    expect(isColorLight("#ffffff")).toBe(true);
    expect(isColorLight("#000000")).toBe(false);
    expect(isColorLight("garbage")).toBe(false);
  });

  it("emits the requested notation", () => {
    expect(formatColor("#ffffff", "HEX")).toBe("#ffffff");
    expect(formatColor("#ffffff", "RGB")).toMatch(/^rgb\(/);
    expect(formatColor("#ffffff", "HSL")).toMatch(/^hsl\(/);
  });
});

describe("auditPalette", () => {
  const accessible: Palette = {
    primary: "#3730a3",
    secondary: "#475569",
    accent: "#b45309",
    background: "#ffffff",
    text: "#0f172a",
  };

  it("passes a palette built for contrast", () => {
    const result = auditPalette(accessible);
    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("flags the light-on-light case that broke the sign-in panel", () => {
    const broken: Palette = { ...accessible, primary: "#dfe9f5", background: "#ffffff" };
    const result = auditPalette(broken);
    expect(result.passed).toBe(false);
    expect(result.failures.map((f) => f.label)).toContain("Headings");
  });

  it("grades every pairing it knows about", () => {
    const result = auditPalette(accessible);
    expect(result.rows).toHaveLength(5);
    for (const row of result.rows) {
      expect(row.ratio).toBeGreaterThan(0);
      expect(row.rating.label).toBeTruthy();
    }
  });
});
