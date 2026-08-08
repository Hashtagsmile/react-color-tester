import { describe, expect, it } from "vitest";
import { EXPORTERS, toAiPrompt, toCss, toJson, toTailwind } from "../src/lib/exporters";
import { parseTheme } from "../src/lib/import";
import type { ExportOptions, Fonts, Palette } from "../src/lib/types";

const light: Palette = {
  primary: "#4f46e5",
  secondary: "#64748b",
  accent: "#f59e0b",
  background: "#ffffff",
  text: "#0f172a",
};

const dark: Palette = {
  primary: "#818cf8",
  secondary: "#94a3b8",
  accent: "#fbbf24",
  background: "#0f172a",
  text: "#e2e8f0",
};

const fonts: Fonts = { header: "Poppins", body: "Inter" };

const opts = (over: Partial<ExportOptions> = {}): ExportOptions => ({
  colorFormat: "HEX",
  bothModes: true,
  current: light,
  ...over,
});

describe("toCss", () => {
  it("emits both scales when bothModes is set", () => {
    const css = toCss(light, dark, fonts, opts());
    expect(css).toContain(":root {");
    expect(css).toContain(':root[data-theme="dark"]');
    expect(css).toContain("--color-primary: #4f46e5;");
    expect(css).toContain("--color-primary: #818cf8;");
  });

  it("emits only the current mode otherwise", () => {
    const css = toCss(light, dark, fonts, opts({ bothModes: false, current: dark }));
    expect(css).not.toContain('data-theme="dark"');
    expect(css).toContain("--color-primary: #818cf8;");
  });

  it("round-trips back through the importer", () => {
    const css = toCss(light, dark, fonts, opts({ bothModes: false }));
    const parsed = parseTheme(css);
    expect(parsed.ok).toBe(true);
    expect(parsed.colors).toEqual(light);
    expect(parsed.fonts).toEqual(fonts);
  });
});

describe("toTailwind", () => {
  it("nests light and dark and stays parseable", () => {
    const config = toTailwind(light, dark, fonts, opts());
    expect(config).toContain("tailwind.config.js");
    expect(config).toContain("light: {");
    expect(config).toContain("dark: {");
    expect(parseTheme(config).ok).toBe(true);
  });
});

describe("toJson", () => {
  it("produces valid JSON with both scales", () => {
    const parsed = JSON.parse(toJson(light, dark, fonts, opts()));
    expect(parsed.colors.light.primary).toBe("#4f46e5");
    expect(parsed.colors.dark.primary).toBe("#818cf8");
    expect(parsed.fonts).toEqual({ heading: "Poppins", body: "Inter" });
  });

  it("honours the colour format", () => {
    const parsed = JSON.parse(toJson(light, dark, fonts, opts({ colorFormat: "RGB" })));
    expect(parsed.colors.light.primary).toMatch(/^rgb\(/);
  });
});

describe("toAiPrompt", () => {
  it("includes the tokens, the role guidance and measured contrast", () => {
    const prompt = toAiPrompt(light, dark, fonts, opts());
    expect(prompt).toContain("## Typography");
    expect(prompt).toContain("primary actions, buttons, links, active states");
    expect(prompt).toContain("--color-primary: #4f46e5;");
    // The contrast column should carry real measurements, not placeholders.
    expect(prompt).toMatch(/\d+\.\d{2}:1/);
  });

  it("marks background as having no self-contrast", () => {
    const prompt = toAiPrompt(light, dark, fonts, opts({ bothModes: false }));
    const backgroundRow = prompt.split("\n").find((l) => l.startsWith("| background"));
    expect(backgroundRow).toContain("—");
  });
});

describe("EXPORTERS", () => {
  it("exposes every format the UI offers and all return non-empty strings", () => {
    expect(Object.keys(EXPORTERS).sort()).toEqual(["AI", "CSS", "JSON", "Tailwind"]);
    for (const render of Object.values(EXPORTERS)) {
      const out = render(light, dark, fonts, opts());
      expect(typeof out).toBe("string");
      expect(out.length).toBeGreaterThan(0);
    }
  });
});
