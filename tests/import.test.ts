import { describe, expect, it } from "vitest";
import { parseTheme } from "../src/lib/import";

describe("parseTheme — CSS custom properties", () => {
  it("reads a plain :root block", () => {
    const result = parseTheme(`
      :root {
        --color-primary: #4f46e5;
        --color-secondary: #64748b;
        --color-accent: #f59e0b;
        --color-background: #ffffff;
        --color-text: #0f172a;
      }
    `);

    expect(result.ok).toBe(true);
    expect(result.source).toBe("css");
    expect(result.missing).toHaveLength(0);
    expect(result.colors).toEqual({
      primary: "#4f46e5",
      secondary: "#64748b",
      accent: "#f59e0b",
      background: "#ffffff",
      text: "#0f172a",
    });
  });

  it("handles undecorated names and non-hex notations", () => {
    const result = parseTheme(`
      --primary: rgb(79, 70, 229);
      --bg: white;
      --foreground: hsl(222, 47%, 11%);
    `);

    expect(result.ok).toBe(true);
    expect(result.colors!.primary).toBe("#4f46e5");
    expect(result.colors!.background).toBe("#ffffff");
    expect(result.colors!.text).toBe("#0f1729");
  });

  it("ignores numeric scale suffixes", () => {
    const result = parseTheme(`--color-primary-500: #4f46e5; --color-background-50: #ffffff;`);
    expect(result.colors!.primary).toBe("#4f46e5");
    expect(result.colors!.background).toBe("#ffffff");
  });

  it("takes the first declaration when a dark override follows", () => {
    const result = parseTheme(`
      :root { --color-background: #ffffff; }
      :root[data-theme="dark"] { --color-background: #0f172a; }
    `);
    expect(result.colors!.background).toBe("#ffffff");
  });

  it("picks up font families and drops the rest of the stack", () => {
    const result = parseTheme(`
      --color-primary: #4f46e5;
      --font-heading: "Playfair Display", serif;
      --font-body: "Inter", sans-serif;
    `);
    expect(result.fonts).toEqual({ header: "Playfair Display", body: "Inter" });
  });
});

describe("parseTheme — Tailwind and JSON", () => {
  it("reads a Tailwind config", () => {
    const result = parseTheme(`
      export default {
        theme: {
          extend: {
            colors: {
              primary: "#4f46e5",
              secondary: "#64748b",
              accent: "#f59e0b",
              background: "#ffffff",
              text: "#0f172a",
            },
          },
        },
      };
    `);

    expect(result.ok).toBe(true);
    expect(result.source).toBe("tailwind");
    expect(result.colors!.primary).toBe("#4f46e5");
    expect(result.missing).toHaveLength(0);
  });

  it("reads plain JSON tokens", () => {
    const result = parseTheme(
      JSON.stringify({
        colors: {
          primary: "#4f46e5",
          secondary: "#64748b",
          accent: "#f59e0b",
          background: "#ffffff",
          text: "#0f172a",
        },
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.colors!.accent).toBe("#f59e0b");
  });

  it("matches common alias names", () => {
    const result = parseTheme(`{ "brand": "#4f46e5", "surface": "#ffffff", "ink": "#0f172a" }`);
    expect(result.colors!.primary).toBe("#4f46e5");
    expect(result.colors!.background).toBe("#ffffff");
    expect(result.colors!.text).toBe("#0f172a");
  });
});

describe("parseTheme — partial and invalid input", () => {
  it("reports which roles were missing instead of inventing them", () => {
    const result = parseTheme(`--color-primary: #4f46e5;`);
    expect(result.ok).toBe(true);
    expect(result.matched).toEqual(["primary"]);
    expect(result.missing).toEqual(["secondary", "accent", "background", "text"]);
    expect(result.colors!.secondary).toBeUndefined();
  });

  it("skips values that aren't colours", () => {
    const result = parseTheme(`--color-primary: #4f46e5; --color-accent: 12px;`);
    expect(result.matched).toEqual(["primary"]);
  });

  it("fails cleanly on empty input", () => {
    const result = parseTheme("   ");
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("fails cleanly when nothing looks like a pair", () => {
    const result = parseTheme("just some prose with no tokens in it at all");
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("fails cleanly when pairs exist but no role matches", () => {
    const result = parseTheme(`--spacing-md: 16px; --radius-lg: 12px;`);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/colour role|color role/i);
  });
});
