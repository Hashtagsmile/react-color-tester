import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const serverPath = resolve(root, "dist-node/mcp/server.js");

// The server runs from compiled output, so this needs `npm run build:node` first.
// Skipping loudly beats a confusing failure for someone who just cloned the repo.
const built = existsSync(serverPath);

const failingPalette = {
  primary: "#dfe9f5",
  secondary: "#cbd5e1",
  accent: "#fde68a",
  background: "#ffffff",
  text: "#94a3b8",
};

const accessiblePalette = {
  primary: "#3730a3",
  secondary: "#475569",
  accent: "#b45309",
  background: "#ffffff",
  text: "#0f172a",
};

describe.skipIf(!built)("theme-lab MCP server", () => {
  let client: Client;

  beforeAll(async () => {
    client = new Client({ name: "theme-lab-tests", version: "1.0.0" });
    await client.connect(
      new StdioClientTransport({ command: "node", args: [serverPath] }),
    );
  }, 30_000);

  afterAll(async () => {
    await client?.close();
  });

  const call = async (name: string, args: Record<string, unknown>) => {
    const res = (await client.callTool({ name, arguments: args })) as {
      content: Array<{ text: string }>;
    };
    return res.content[0].text;
  };

  it("advertises the tools an assistant needs", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "audit_stylesheet",
      "check_contrast",
      "export_theme",
      "parse_tokens",
      "preview_theme",
    ]);
  });

  it("fails a palette that can't be read", async () => {
    const result = JSON.parse(await call("check_contrast", { palette: failingPalette }));
    expect(result.passed).toBe(false);
    expect(result.failures).toContain("Body text");
    expect(result.advice).toMatch(/darken|lighten/i);
  });

  it("passes a palette built for contrast", async () => {
    const result = JSON.parse(await call("check_contrast", { palette: accessiblePalette }));
    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("applies the stricter AAA threshold when asked", async () => {
    const aa = JSON.parse(await call("check_contrast", { palette: accessiblePalette }));
    const aaa = JSON.parse(
      await call("check_contrast", { palette: accessiblePalette, level: "AAA" }),
    );
    expect(aa.threshold).toBe("AA");
    expect(aaa.threshold).toBe("AAA");
  });

  it("exports CSS custom properties", async () => {
    const css = await call("export_theme", {
      palette: accessiblePalette,
      format: "CSS",
      bothModes: false,
    });
    expect(css).toContain(":root {");
    expect(css).toContain("--color-primary: #3730a3;");
  });

  it("round-trips a palette through a share link", async () => {
    const url = await call("preview_theme", { palette: accessiblePalette });
    expect(url).toMatch(/^https:\/\/.+\?theme=[\w-]+$/);
  });

  it("audits a real stylesheet by discovering its own pairings", async () => {
    // Nothing here maps onto the five-role model, and the surface is a
    // color-mix — the case that used to resolve to its first ingredient.
    const css = `
      :root {
        --ink: #0f172a;
        --page: #ffffff;
        --surface: color-mix(in srgb, var(--ink) 4%, var(--page));
        --faint: #b8c0cc;
      }
      body { background: var(--page); color: var(--ink); }
      .note { color: var(--faint); background: var(--surface); }
      .headline { color: var(--faint); background: var(--surface); font-size: 2rem; }
    `;
    const result = JSON.parse(await call("audit_stylesheet", { css }));

    expect(result.tokensFound).toBe(4);
    expect(result.passed).toBe(false);

    const note = result.confirmedFailures.find((f: any) => f.selector === ".note");
    expect(note.needs).toBe(4.5);
    // The 2rem headline is large text, so it gets the 3:1 bar instead.
    const headline = result.confirmedFailures.find((f: any) => f.selector === ".headline");
    expect(headline?.needs ?? 3).toBe(3);
  });

  it("parses tokens using alias names", async () => {
    const parsed = JSON.parse(
      await call("parse_tokens", { source: "--brand: #4f46e5; --surface: #fff; --ink: #0f172a;" }),
    );
    expect(parsed.ok).toBe(true);
    expect(parsed.colors.primary).toBe("#4f46e5");
    expect(parsed.matched).toEqual(expect.arrayContaining(["primary", "background", "text"]));
  });
});
