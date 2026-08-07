import { COLOR_KEYS } from "./theme";
import { formatColor, contrastRatio, contrastRating } from "./utilities";

/**
 * Theme exporters. Each takes the resolved light + dark palettes, the font pair,
 * and options, and returns a ready-to-paste string. Kept out of the component so
 * the modal stays a thin view.
 */

const ROLE_USAGE = {
  primary: "primary actions, buttons, links, active states",
  secondary: "muted surfaces, secondary text and controls",
  accent: "highlights, badges, focus rings",
  background: "app / page background",
  text: "body copy and headings",
};

const fmt = (c, colorFormat) => formatColor(c, colorFormat);

const cssBlock = (map, selector, fonts, colorFormat) => {
  const lines = COLOR_KEYS.map((k) => `  --color-${k}: ${fmt(map[k], colorFormat)};`);
  lines.push(`  --font-heading: "${fonts.header}", sans-serif;`);
  lines.push(`  --font-body: "${fonts.body}", sans-serif;`);
  return `${selector} {\n${lines.join("\n")}\n}`;
};

export const toCss = (light, dark, fonts, { colorFormat, bothModes, current }) =>
  bothModes
    ? `${cssBlock(light, ":root", fonts, colorFormat)}\n\n${cssBlock(dark, ':root[data-theme="dark"]', fonts, colorFormat)}`
    : cssBlock(current, ":root", fonts, colorFormat);

export const toTailwind = (light, dark, fonts, { colorFormat, bothModes, current }) => {
  const line = (map, k, indent) => `${indent}${k}: "${fmt(map[k], colorFormat)}",`;
  const colorsBlock = bothModes
    ? `        light: {\n${COLOR_KEYS.map((k) => line(light, k, "          ")).join("\n")}\n        },\n        dark: {\n${COLOR_KEYS.map((k) => line(dark, k, "          ")).join("\n")}\n        },`
    : COLOR_KEYS.map((k) => line(current, k, "        ")).join("\n");
  return `// tailwind.config.js\nexport default {\n  theme: {\n    extend: {\n      colors: {\n${colorsBlock}\n      },\n      fontFamily: {\n        heading: ["${fonts.header}", "sans-serif"],\n        body: ["${fonts.body}", "sans-serif"],\n      },\n    },\n  },\n};`;
};

export const toJson = (light, dark, fonts, { colorFormat, bothModes, current }) => {
  const colorsOf = (map) =>
    COLOR_KEYS.reduce((o, k) => ({ ...o, [k]: fmt(map[k], colorFormat) }), {});
  const payload = bothModes
    ? {
        colors: { light: colorsOf(light), dark: colorsOf(dark) },
        fonts: { heading: fonts.header, body: fonts.body },
      }
    : { colors: colorsOf(current), fonts: { heading: fonts.header, body: fonts.body } };
  return JSON.stringify(payload, null, 2);
};

const paletteTable = (map) =>
  COLOR_KEYS.map((k) => {
    const contrast =
      k === "background"
        ? "—"
        : `${contrastRatio(map[k], map.background).toFixed(2)}:1 ${contrastRating(contrastRatio(map[k], map.background), false).label}`;
    return `| ${k.padEnd(10)} | ${map[k]} | ${ROLE_USAGE[k]} | ${contrast} |`;
  }).join("\n");

// A natural-language + tokens brief designed to paste into an AI coding assistant
// (Cursor, Claude Code, Copilot, v0, …) so it applies the theme consistently.
export const toAiPrompt = (light, dark, fonts, { bothModes, current }) => {
  const intro = `Apply this design system to the project. Use CSS custom properties (or the project's existing token system) — never hardcode hex values in components. Keep body text at WCAG AA (>= 4.5:1) contrast against its background.

## Typography
- Headings: "${fonts.header}"
- Body: "${fonts.body}"
`;

  const table = (label, map) =>
    `\n## Colors — ${label}\n| role | hex | use for | contrast on background |\n| --- | --- | --- | --- |\n${paletteTable(map)}\n`;

  const palettes = bothModes
    ? table("light mode", light) + table("dark mode", dark)
    : table("current mode", current);

  const tokens = bothModes
    ? `${cssBlock(light, ":root", fonts, "HEX")}\n\n${cssBlock(dark, ':root[data-theme="dark"]', fonts, "HEX")}`
    : cssBlock(current, ":root", fonts, "HEX");

  return `${intro}${palettes}\n## Tokens (paste into your global stylesheet)\n\`\`\`css\n${tokens}\n\`\`\`\n`;
};

export const EXPORTERS = { CSS: toCss, Tailwind: toTailwind, JSON: toJson, AI: toAiPrompt };
