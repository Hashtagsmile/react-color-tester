#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { auditPalette } from "../src/lib/audit.js";
import { parseTheme } from "../src/lib/import.js";
import { EXPORTERS } from "../src/lib/exporters.js";
import { encodeTheme, generateVariant } from "../src/lib/theme.js";
import { COLOR_KEYS } from "../src/lib/types.js";
import type { ColorFormat, ExportFormat, Palette } from "../src/lib/types.js";

/**
 * Theme Lab as an MCP server.
 *
 * Lets a coding assistant check its own palette before it writes the CSS, rather
 * than the developer discovering the contrast problem in review. Same `lib/`
 * functions the web app and the CLI use, so the verdicts can't diverge.
 */

const paletteSchema = z.object({
  primary: z.string().describe("Primary brand colour, any CSS notation"),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  text: z.string(),
});

const text = (body: string) => ({ content: [{ type: "text" as const, text: body }] });

const server = new McpServer({ name: "theme-lab", version: "1.0.0" });

server.registerTool(
  "check_contrast",
  {
    title: "Check palette contrast",
    description:
      "Grade a five-role colour palette against WCAG 2.1 for the pairings real UI actually renders (body text, headings, button labels, accent and secondary on background). Returns each ratio with an AA/AAA/Fail verdict. Use before writing theme CSS.",
    inputSchema: {
      palette: paletteSchema,
      level: z.enum(["AA", "AAA"]).optional().describe("Threshold to grade against. Default AA."),
    },
  },
  async ({ palette, level }) => {
    const requireAaa = level === "AAA";
    const { rows } = auditPalette(palette as Palette);
    const graded = rows.map((r) => ({
      pairing: r.label,
      foreground: r.foreground,
      background: r.background,
      ratio: Number(r.ratio.toFixed(2)),
      rating: r.rating.label,
      passes: requireAaa ? r.rating.level === "aaa" : r.rating.pass,
    }));
    const failures = graded.filter((r) => !r.passes);

    return text(
      JSON.stringify(
        {
          threshold: requireAaa ? "AAA" : "AA",
          passed: failures.length === 0,
          failures: failures.map((f) => f.pairing),
          rows: graded,
          // Say what to do about it, not just that it's broken.
          advice: failures.length
            ? "Darken the foreground or lighten the background for each failing pairing until it clears the threshold, then re-check."
            : "Palette is safe to use as-is.",
        },
        null,
        2,
      ),
    );
  },
);

server.registerTool(
  "export_theme",
  {
    title: "Export theme tokens",
    description:
      "Convert a five-role palette into ready-to-paste CSS custom properties, a Tailwind config, JSON tokens, or a design-system brief. A matching dark scale is derived automatically.",
    inputSchema: {
      palette: paletteSchema,
      format: z.enum(["CSS", "Tailwind", "JSON", "AI"]).optional(),
      colorFormat: z.enum(["HEX", "RGB", "HSL"]).optional(),
      fonts: z
        .object({ header: z.string(), body: z.string() })
        .optional()
        .describe("Heading and body typefaces. Defaults to Poppins / Inter."),
      bothModes: z.boolean().optional().describe("Emit light and dark scales. Default true."),
    },
  },
  async ({ palette, format, colorFormat, fonts, bothModes }) => {
    const light = palette as Palette;
    const dark = generateVariant(light, true);
    const render = EXPORTERS[(format ?? "CSS") as ExportFormat];

    return text(
      render(light, dark, fonts ?? { header: "Poppins", body: "Inter" }, {
        colorFormat: (colorFormat ?? "HEX") as ColorFormat,
        bothModes: bothModes ?? true,
        current: light,
      }),
    );
  },
);

server.registerTool(
  "preview_theme",
  {
    title: "Open a palette in Theme Lab",
    description:
      "Turn a palette into a Theme Lab share link so a human can see it applied to a real landing page, sign-in screen and dashboard. Use when someone should eyeball the theme rather than trust the numbers.",
    inputSchema: {
      palette: paletteSchema,
      fonts: z.object({ header: z.string(), body: z.string() }).optional(),
      darkMode: z.boolean().optional(),
    },
  },
  async ({ palette, fonts, darkMode }) => {
    const encoded = encodeTheme(
      palette as Palette,
      fonts ?? { header: "Poppins", body: "Inter" },
      darkMode ?? false,
    );
    return text(`https://react-color-tester.vercel.app/?theme=${encoded}`);
  },
);

server.registerTool(
  "parse_tokens",
  {
    title: "Parse tokens into a palette",
    description:
      "Extract a five-role palette from pasted CSS custom properties, a Tailwind config, or JSON tokens. Reports which roles were found and which are missing. Use to read an existing codebase's theme before changing it.",
    inputSchema: {
      source: z.string().describe("Raw CSS, Tailwind config or JSON containing colour tokens"),
    },
  },
  async ({ source }) => {
    const result = parseTheme(source);
    return text(
      JSON.stringify(
        result.ok
          ? {
              ok: true,
              detected: result.source,
              colors: result.colors,
              fonts: result.fonts,
              matched: result.matched,
              missing: result.missing,
              roles: COLOR_KEYS,
            }
          : { ok: false, error: result.error },
        null,
        2,
      ),
    );
  },
);

await server.connect(new StdioServerTransport());
