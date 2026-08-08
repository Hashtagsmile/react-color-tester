import { contrastRatio, contrastRating, formatColor } from "./color.js";
import { COLOR_KEYS } from "./types.js";
import type { ColorFormat, ExportOptions, Fonts, Palette } from "./types.js";

/**
 * Theme exporters. Each takes the resolved light + dark palettes, the font pair
 * and options, and returns a ready-to-paste string. Kept out of the component so
 * the modal stays a thin view — and so the CLI and MCP server can reuse them.
 */

const ROLE_USAGE: Record<string, string> = {
  primary: "primary actions, buttons, links, active states",
  secondary: "muted surfaces, secondary text and controls",
  accent: "highlights, badges, focus rings",
  background: "app / page background",
  text: "body copy and headings",
};

const cssBlock = (
  map: Palette,
  selector: string,
  fonts: Fonts,
  colorFormat: ColorFormat,
): string => {
  const lines = COLOR_KEYS.map((k) => `  --color-${k}: ${formatColor(map[k], colorFormat)};`);
  lines.push(`  --font-heading: "${fonts.header}", sans-serif;`);
  lines.push(`  --font-body: "${fonts.body}", sans-serif;`);
  return `${selector} {\n${lines.join("\n")}\n}`;
};

export const toCss = (
  light: Palette,
  dark: Palette,
  fonts: Fonts,
  { colorFormat, bothModes, current }: ExportOptions,
): string =>
  bothModes
    ? `${cssBlock(light, ":root", fonts, colorFormat)}\n\n${cssBlock(dark, ':root[data-theme="dark"]', fonts, colorFormat)}`
    : cssBlock(current, ":root", fonts, colorFormat);

export const toTailwind = (
  light: Palette,
  dark: Palette,
  fonts: Fonts,
  { colorFormat, bothModes, current }: ExportOptions,
): string => {
  const line = (map: Palette, k: (typeof COLOR_KEYS)[number], indent: string) =>
    `${indent}${k}: "${formatColor(map[k], colorFormat)}",`;
  const colorsBlock = bothModes
    ? `        light: {\n${COLOR_KEYS.map((k) => line(light, k, "          ")).join("\n")}\n        },\n        dark: {\n${COLOR_KEYS.map((k) => line(dark, k, "          ")).join("\n")}\n        },`
    : COLOR_KEYS.map((k) => line(current, k, "        ")).join("\n");
  return `// tailwind.config.js\nexport default {\n  theme: {\n    extend: {\n      colors: {\n${colorsBlock}\n      },\n      fontFamily: {\n        heading: ["${fonts.header}", "sans-serif"],\n        body: ["${fonts.body}", "sans-serif"],\n      },\n    },\n  },\n};`;
};

export const toJson = (
  light: Palette,
  dark: Palette,
  fonts: Fonts,
  { colorFormat, bothModes, current }: ExportOptions,
): string => {
  const colorsOf = (map: Palette) =>
    COLOR_KEYS.reduce<Record<string, string>>(
      (o, k) => ({ ...o, [k]: formatColor(map[k], colorFormat) }),
      {},
    );
  const payload = bothModes
    ? {
        colors: { light: colorsOf(light), dark: colorsOf(dark) },
        fonts: { heading: fonts.header, body: fonts.body },
      }
    : { colors: colorsOf(current), fonts: { heading: fonts.header, body: fonts.body } };
  return JSON.stringify(payload, null, 2);
};

const paletteTable = (map: Palette): string =>
  COLOR_KEYS.map((k) => {
    const ratio = contrastRatio(map[k], map.background);
    const contrast =
      k === "background" ? "—" : `${ratio.toFixed(2)}:1 ${contrastRating(ratio, false).label}`;
    return `| ${k.padEnd(10)} | ${map[k]} | ${ROLE_USAGE[k]} | ${contrast} |`;
  }).join("\n");

/**
 * A natural-language + tokens brief designed to paste into an AI coding assistant
 * (Cursor, Claude Code, Copilot, v0) so it applies the theme consistently.
 */
export const toAiPrompt = (
  light: Palette,
  dark: Palette,
  fonts: Fonts,
  { bothModes, current }: ExportOptions,
): string => {
  const intro = `Apply this design system to the project. Use CSS custom properties (or the project's existing token system) — never hardcode hex values in components. Keep body text at WCAG AA (>= 4.5:1) contrast against its background.

## Typography
- Headings: "${fonts.header}"
- Body: "${fonts.body}"
`;

  const table = (label: string, map: Palette) =>
    `\n## Colors — ${label}\n| role | hex | use for | contrast on background |\n| --- | --- | --- | --- |\n${paletteTable(map)}\n`;

  const palettes = bothModes
    ? table("light mode", light) + table("dark mode", dark)
    : table("current mode", current);

  const tokens = bothModes
    ? `${cssBlock(light, ":root", fonts, "HEX")}\n\n${cssBlock(dark, ':root[data-theme="dark"]', fonts, "HEX")}`
    : cssBlock(current, ":root", fonts, "HEX");

  return `${intro}${palettes}\n## Tokens (paste into your global stylesheet)\n\`\`\`css\n${tokens}\n\`\`\`\n`;
};

export const EXPORTERS = {
  CSS: toCss,
  Tailwind: toTailwind,
  JSON: toJson,
  AI: toAiPrompt,
} as const;
