import { describe, expect, it } from "vitest";
import chroma from "chroma-js";
import { auditPalette } from "../src/lib/audit";
import { contrastRatio } from "../src/lib/color";
import { makeAccessible, nudgeToContrast, suggestFix, suggestFixes } from "../src/lib/remediate";
import { randomColors } from "../src/lib/theme";
import { COLOR_KEYS } from "../src/lib/types";
import type { LockMap, Palette } from "../src/lib/types";

const noLocks: LockMap = {
  primary: false,
  secondary: false,
  accent: false,
  background: false,
  text: false,
};

// The palette from the screenshot that prompted this: amber accent and a washed
// primary on a light background, three rows failing.
const failing: Palette = {
  primary: "#dfe9f5",
  secondary: "#cbd5e1",
  accent: "#fde68a",
  background: "#ffffff",
  text: "#0f172a",
};

describe("nudgeToContrast", () => {
  it("reaches the target against a light background by darkening", () => {
    const fixed = nudgeToContrast("#fde68a", "#ffffff", 3);
    expect(contrastRatio(fixed, "#ffffff")).toBeGreaterThanOrEqual(3);
    expect(chroma(fixed).luminance()).toBeLessThan(chroma("#fde68a").luminance());
  });

  it("reaches the target against a dark background by lightening", () => {
    const fixed = nudgeToContrast("#1e293b", "#0f172a", 4.5);
    expect(contrastRatio(fixed, "#0f172a")).toBeGreaterThanOrEqual(4.5);
    expect(chroma(fixed).luminance()).toBeGreaterThan(chroma("#1e293b").luminance());
  });

  it("keeps the hue recognisable", () => {
    const fixed = nudgeToContrast("#fde68a", "#ffffff", 3);
    const before = chroma("#fde68a").get("hsl.h");
    const after = chroma(fixed).get("hsl.h");
    expect(Math.abs(after - before)).toBeLessThan(12);
  });

  it("leaves an already-passing colour untouched", () => {
    expect(nudgeToContrast("#0f172a", "#ffffff", 4.5)).toBe("#0f172a");
  });

  it("terminates on a colour that can never reach the target", () => {
    // Black on black is unreachable; the guard has to stop it.
    const fixed = nudgeToContrast("#000000", "#000000", 7);
    expect(typeof fixed).toBe("string");
  });

  it("returns the input unchanged for invalid colours", () => {
    expect(nudgeToContrast("nonsense", "#fff", 4.5)).toBe("nonsense");
  });
});

describe("suggestFix", () => {
  it("proposes a change that actually clears the row", () => {
    for (const row of auditPalette(failing).failures) {
      const suggestion = suggestFix(failing, row, noLocks);
      expect(suggestion, `no suggestion for ${row.label}`).not.toBeNull();

      const patched = { ...failing, [suggestion!.role]: suggestion!.to };
      const after = auditPalette(patched).rows.find((r) => r.label === row.label)!;
      expect(after.rating.pass, `${row.label} still failing`).toBe(true);
    }
  });

  it("prefers moving the foreground over the background", () => {
    const row = auditPalette(failing).failures.find((r) => r.label === "Accent on bg")!;
    expect(suggestFix(failing, row, noLocks)!.role).toBe("accent");
  });

  it("falls back to the background when the foreground is locked", () => {
    const locked: LockMap = { ...noLocks, accent: true };
    const row = auditPalette(failing).failures.find((r) => r.label === "Accent on bg")!;
    expect(suggestFix(failing, row, locked)!.role).toBe("background");
  });

  it("gives up rather than overriding the user's locks", () => {
    const locked: LockMap = { ...noLocks, accent: true, background: true };
    const row = auditPalette(failing).failures.find((r) => r.label === "Accent on bg")!;
    expect(suggestFix(failing, row, locked)).toBeNull();
  });

  it("returns nothing for a row that already passes", () => {
    const row = auditPalette(failing).rows.find((r) => r.label === "Body text")!;
    expect(row.rating.pass).toBe(true);
    expect(suggestFix(failing, row, noLocks)).toBeNull();
  });

  it("carries the plain-language reason through", () => {
    const row = auditPalette(failing).failures[0];
    expect(suggestFix(failing, row, noLocks)!.reason.length).toBeGreaterThan(30);
  });
});

describe("suggestFixes", () => {
  it("returns one suggestion per failing pairing", () => {
    const { failures } = auditPalette(failing);
    expect(suggestFixes(failing, noLocks)).toHaveLength(failures.length);
  });
});

describe("makeAccessible", () => {
  it("clears a palette that was failing three ways", () => {
    expect(auditPalette(failing).passed).toBe(false);
    expect(auditPalette(makeAccessible(failing, noLocks)).passed).toBe(true);
  });

  it("never moves a locked colour", () => {
    const locked: LockMap = { ...noLocks, accent: true, primary: true };
    const result = makeAccessible(failing, locked);
    expect(result.accent).toBe(failing.accent);
    expect(result.primary).toBe(failing.primary);
  });

  it("leaves an already-compliant palette alone", () => {
    const good: Palette = {
      primary: "#3730a3",
      secondary: "#475569",
      accent: "#b45309",
      background: "#ffffff",
      text: "#0f172a",
    };
    expect(makeAccessible(good, noLocks)).toEqual(good);
  });

  it("terminates when everything is locked", () => {
    const allLocked: LockMap = {
      primary: true,
      secondary: true,
      accent: true,
      background: true,
      text: true,
    };
    expect(makeAccessible(failing, allLocked)).toEqual(failing);
  });

  it("always returns five valid hex values", () => {
    const result = makeAccessible(failing, noLocks);
    for (const key of COLOR_KEYS) {
      expect(result[key]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe("randomize is accessible by default", () => {
  // This is the bug that started it: Randomize routinely produced palettes with
  // three of five rows failing, and nothing surfaced it.
  it("produces a passing palette across many draws", () => {
    const failures: string[] = [];

    for (let i = 0; i < 400; i += 1) {
      const dark = i % 2 === 0;
      const raw = randomColors(noLocks, failing, dark);
      const result = auditPalette(makeAccessible(raw, noLocks));
      if (!result.passed) {
        failures.push(result.failures.map((f) => `${f.label} ${f.ratio.toFixed(2)}`).join(", "));
      }
    }

    expect(failures, `failing draws:\n${failures.slice(0, 5).join("\n")}`).toEqual([]);
  });
});

describe("direction choice", () => {
  // Picking the nudge direction from `background.luminance() > 0.5` alone left
  // mid-luminance backgrounds permanently failing: lightening caps out below
  // the target while darkening clears it easily. Found by the 400-draw test.
  it("darkens when lightening can't reach the target", () => {
    const background = "#7f7f7f";
    const fixed = nudgeToContrast("#8a8a8a", background, 3);
    expect(contrastRatio(fixed, background)).toBeGreaterThanOrEqual(3);
  });

  it("reaches the target against mid-luminance backgrounds across the band", () => {
    const stuck: string[] = [];
    for (let l = 30; l <= 70; l += 2) {
      const background = chroma(`hsl(0, 0%, ${l}%)`).hex();
      const fixed = nudgeToContrast(background, background, 3);
      if (contrastRatio(fixed, background) < 3) stuck.push(`${background}`);
    }
    expect(stuck, `unreachable: ${stuck.join(", ")}`).toEqual([]);
  });
});
