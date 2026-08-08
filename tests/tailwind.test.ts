import { describe, expect, it } from "vitest";
import {
  discoverClassPairs,
  extractClassLists,
  flattenColors,
  parseTailwindColors,
} from "../src/lib/tailwind";
import { discoverPairs } from "../src/lib/discover";

describe("flattenColors", () => {
  it("flattens a nested scale", () => {
    expect(flattenColors({ brand: { 500: "#6366f1", 700: "#4338ca" } })).toEqual({
      "brand-500": "#6366f1",
      "brand-700": "#4338ca",
    });
  });

  it("maps DEFAULT to the bare name, matching `bg-brand`", () => {
    expect(flattenColors({ brand: { DEFAULT: "#6366f1", 500: "#6366f1" } })["brand"]).toBe(
      "#6366f1",
    );
  });

  it("keeps top-level colours and drops non-colours", () => {
    const out = flattenColors({ white: "#ffffff", spacing: "1rem", inherit: "inherit" });
    expect(out["white"]).toBe("#ffffff");
    expect(out["spacing"]).toBeUndefined();
  });
});

describe("parseTailwindColors", () => {
  // Textual, not evaluated — a config is arbitrary JavaScript and running a
  // project's build file to read a palette isn't a trade worth making.
  const config = `
    /** @type {import('tailwindcss').Config} */
    import defaults from "tailwindcss/colors";
    export default {
      content: ["./src/**/*.tsx"],
      theme: {
        extend: {
          colors: {
            brand: { 500: "#6366f1", DEFAULT: "#4338ca" },
            surface: "#f8fafc",
            ...defaults,
            computed: someFunction(),
          },
        },
      },
    };
  `;

  it("reads literal colours out of the config", () => {
    const out = parseTailwindColors(config);
    expect(out["brand-500"]).toBe("#6366f1");
    expect(out["brand"]).toBe("#4338ca");
    expect(out["surface"]).toBe("#f8fafc");
  });

  it("skips values it can't read without executing the file", () => {
    expect(parseTailwindColors(config)["computed"]).toBeUndefined();
  });

  it("ignores commented-out colours", () => {
    const out = parseTailwindColors(`colors: { /* old: "#000000", */ live: "#123456" }`);
    expect(out["old"]).toBeUndefined();
    expect(out["live"]).toBe("#123456");
  });

  it("returns nothing for a config with no colours", () => {
    expect(parseTailwindColors(`export default { content: [] }`)).toEqual({});
  });
});

describe("extractClassLists", () => {
  it("finds class and className in the forms they're written", () => {
    const lists = extractClassLists(`
      <div class="a b" />
      <span className="c d" />
      <p className={\`e f\`} />
      <i className={"g h"} />
    `);
    expect(lists).toContain("a b");
    expect(lists).toContain("c d");
    expect(lists).toContain("e f");
    expect(lists).toContain("g h");
  });
});

describe("discoverClassPairs", () => {
  const pairsOf = (markup: string) => discoverClassPairs(markup);
  const find = (markup: string, fg: string, bg: string) =>
    pairsOf(markup).find((p) => p.foreground === fg && p.background === bg);

  it("pairs a text colour with a background on the same element", () => {
    const p = find(`<div class="text-gray-500 bg-white" />`, "gray-500", "white");
    expect(p?.origin).toBe("rule");
  });

  it("reads the large-text threshold off the size class", () => {
    expect(find(`<h1 class="text-2xl text-gray-500 bg-white" />`, "gray-500", "white")?.large).toBe(
      true,
    );
    expect(find(`<p class="text-sm text-gray-500 bg-white" />`, "gray-500", "white")?.large).toBe(
      false,
    );
  });

  it("treats large-bold as large", () => {
    const p = find(`<p class="text-xl font-bold text-gray-500 bg-white" />`, "gray-500", "white");
    expect(p?.large).toBe(true);
  });

  it("doesn't mistake a size class for a colour", () => {
    expect(pairsOf(`<p class="text-lg bg-white" />`)).toHaveLength(0);
  });

  it("skips a translucent background — there's no ratio to measure", () => {
    // bg-gray-500/10 over white is nearly white; grading it as solid gray-500
    // reported passing UI as a 2.13:1 failure.
    expect(pairsOf(`<div class="text-gray-700 bg-gray-500/10" />`)).toHaveLength(0);
  });

  it("lets a hover background pair with the base text colour", () => {
    const p = find(`<a class="text-gray-300 hover:bg-gray-50" />`, "gray-300", "gray-50");
    expect(p).toBeTruthy();
    expect(p!.selector).toContain("hover");
  });

  it("won't pair a dark-variant text colour against the light background", () => {
    // In dark mode the surface changes too, usually on an ancestor.
    expect(find(`<div class="bg-white text-gray-900 dark:text-gray-200" />`, "gray-200", "white"))
      .toBeUndefined();
  });

  it("does pair a dark variant when the element declares its own dark surface", () => {
    const p = find(
      `<div class="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-400" />`,
      "gray-400",
      "gray-800",
    );
    expect(p).toBeTruthy();
  });

  it("skips a dark variant whose own surface is translucent", () => {
    const markup = `<div class="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" />`;
    expect(find(markup, "amber-300", "amber-100")).toBeUndefined();
  });

  it("downgrades an interpolated class list to inferred", () => {
    // Classes from different branches may never apply together.
    const p = find(
      "<div className={`text-emerald-700 ${cond ? 'bg-emerald-900' : ''}`} />",
      "emerald-700",
      "emerald-900",
    );
    expect(p?.origin).toBe("implied");
  });

  it("ignores arbitrary values, which carry their own colour", () => {
    expect(pairsOf(`<div class="text-[#abc123] bg-white" />`)).toHaveLength(0);
  });
});

describe("BEM surfaces", () => {
  it("resolves a block's surface for its element", () => {
    // `.card__meta` is inside `.card`, but nothing in the CSS says so.
    const pair = discoverPairs(`
      :root { --page: #000000; --card: #ffffff; --ink: #64748b; }
      body { background: var(--page); }
      .card { background: var(--card); }
      .card__meta { color: var(--ink); }
    `).find((p) => p.foreground === "ink");
    expect(pair?.background).toBe("card");
  });

  it("resolves a modifier the same way", () => {
    const pair = discoverPairs(`
      :root { --page: #000000; --card: #ffffff; --ink: #64748b; }
      body { background: var(--page); }
      .card { background: var(--card); }
      .card--compact { color: var(--ink); }
    `).find((p) => p.foreground === "ink");
    expect(pair?.background).toBe("card");
  });

  it("doesn't treat a single dash as nesting", () => {
    // `.text-muted` is not inside `.text` — that guess would be wrong far more
    // often than right.
    const pair = discoverPairs(`
      :root { --page: #ffffff; --text-bg: #000000; --ink: #64748b; }
      body { background: var(--page); }
      .text { background: var(--text-bg); }
      .text-muted { color: var(--ink); }
    `).find((p) => p.foreground === "ink");
    expect(pair?.background).toBe("page");
  });
});
