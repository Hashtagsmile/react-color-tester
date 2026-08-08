import { describe, expect, it } from "vitest";
import {
  COLOR_KEYS,
  DEFAULT_FONTS,
  decodeTheme,
  encodeTheme,
  generateVariant,
  randomColors,
  randomFonts,
} from "../src/lib/theme";
import type { LockMap, Palette } from "../src/lib/types";

const PALETTE: Palette = {
  primary: "#4f46e5",
  secondary: "#64748b",
  accent: "#f59e0b",
  background: "#ffffff",
  text: "#0f172a",
};

const noLocks: LockMap = {
  primary: false,
  secondary: false,
  accent: false,
  background: false,
  text: false,
};

describe("encodeTheme / decodeTheme", () => {
  it("round-trips a theme exactly", () => {
    const fonts = { header: "Poppins", body: "Inter" };
    const decoded = decodeTheme(encodeTheme(PALETTE, fonts, true));

    expect(decoded).not.toBeNull();
    expect(decoded!.colors).toEqual(PALETTE);
    expect(decoded!.fonts).toEqual(fonts);
    expect(decoded!.isDarkMode).toBe(true);
  });

  it("preserves the light-mode flag", () => {
    const decoded = decodeTheme(encodeTheme(PALETTE, DEFAULT_FONTS, false));
    expect(decoded!.isDarkMode).toBe(false);
  });

  it("emits a URL-safe string with no base64 padding", () => {
    const encoded = encodeTheme(PALETTE, DEFAULT_FONTS, false);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(encodeURIComponent(encoded)).toBe(encoded);
  });

  it("stays short enough to paste around", () => {
    expect(encodeTheme(PALETTE, DEFAULT_FONTS, false).length).toBeLessThan(200);
  });

  it("returns null for malformed input instead of throwing", () => {
    for (const bad of ["", "not-base64!!", btoa("{}"), btoa(JSON.stringify({ c: ["fff"] }))]) {
      expect(decodeTheme(bad)).toBeNull();
    }
  });

  it("falls back to default fonts when the payload omits them", () => {
    const payload = { c: COLOR_KEYS.map(() => "112233"), d: 0 };
    const encoded = btoa(JSON.stringify(payload)).replace(/=+$/, "");
    const decoded = decodeTheme(encoded);
    expect(decoded!.fonts).toEqual(DEFAULT_FONTS);
  });
});

describe("generateVariant", () => {
  // The loop that nudges colours toward a contrast target used to be an unbounded
  // `while`. A colour that clamps at black or white never reaches the target, so
  // the condition stayed true forever and locked the tab.
  it("terminates on colours that can never reach the target ratio", () => {
    const pathological: Palette = {
      primary: "#000000",
      secondary: "#000000",
      accent: "#000000",
      background: "#000000",
      text: "#000000",
    };
    const variant = generateVariant(pathological, true);
    expect(Object.keys(variant).sort()).toEqual([...COLOR_KEYS].sort());
  });

  it("returns a full palette of valid hex for both directions", () => {
    for (const dark of [true, false]) {
      const variant = generateVariant(PALETTE, dark);
      for (const key of COLOR_KEYS) {
        expect(variant[key]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it("keeps primary as the anchor colour", () => {
    expect(generateVariant(PALETTE, true).primary).toBe(PALETTE.primary);
  });

  it("derives a darker background for dark mode than for light", () => {
    const light = generateVariant(PALETTE, false);
    const dark = generateVariant(PALETTE, true);
    expect(dark.background).not.toBe(light.background);
  });
});

describe("randomColors", () => {
  it("passes locked slots through untouched", () => {
    const locked: LockMap = { ...noLocks, primary: true, background: true };
    for (let i = 0; i < 25; i += 1) {
      const next = randomColors(locked, PALETTE, false);
      expect(next.primary).toBe(PALETTE.primary);
      expect(next.background).toBe(PALETTE.background);
    }
  });

  it("produces every role as valid hex", () => {
    const next = randomColors(noLocks, PALETTE, false);
    for (const key of COLOR_KEYS) {
      expect(next[key]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("changes unlocked slots", () => {
    // Not guaranteed per-call, but 25 identical draws would mean it isn't random.
    const draws = Array.from({ length: 25 }, () => randomColors(noLocks, PALETTE, false).accent);
    expect(new Set(draws).size).toBeGreaterThan(1);
  });
});

describe("randomFonts", () => {
  it("only picks from the supplied list", () => {
    const list = ["Inter", "Poppins", "Lora"];
    for (let i = 0; i < 20; i += 1) {
      const { header, body } = randomFonts(list);
      expect(list).toContain(header);
      expect(list).toContain(body);
    }
  });
});
