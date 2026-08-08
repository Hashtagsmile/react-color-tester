#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { auditPalette } from "../src/lib/audit.js";
import { parseTheme } from "../src/lib/import.js";
import { EXPORTERS } from "../src/lib/exporters.js";
import { generateVariant } from "../src/lib/theme.js";
import { COLOR_KEYS } from "../src/lib/types.js";
import type { ColorFormat, ExportFormat, Palette } from "../src/lib/types.js";

/**
 * `theme-lab` — the contrast gate.
 *
 * Assistants generate a lot of CSS. This makes "did the palette stay accessible"
 * a build step rather than something a human has to notice in review.
 */

const USAGE = `theme-lab — check and convert design tokens

Usage:
  theme-lab check <file>            Grade a token file against WCAG. Exits 1 on failure.
  theme-lab export <file> [format]  Convert tokens to css | tailwind | json | ai.

Options:
  --min <aa|aaa>   Threshold for check (default: aa)
  --format <hex|rgb|hsl>
  --json           Machine-readable output
  -h, --help

Reads stdin when <file> is "-".
`;

const read = (file: string): string =>
  file === "-" ? readFileSync(0, "utf8") : readFileSync(file, "utf8");

const flag = (argv: string[], name: string): string | undefined => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 ? argv[i + 1] : undefined;
};

const fail = (message: string): never => {
  process.stderr.write(`${message}\n`);
  process.exit(2);
};

/** Fill roles the file didn't declare so a partial token set can still be graded. */
const completePalette = (partial: Partial<Palette>): Palette => {
  const filled = { ...partial } as Palette;
  for (const key of COLOR_KEYS) {
    if (!filled[key]) filled[key] = key === "background" ? "#ffffff" : "#000000";
  }
  return filled;
};

const main = (): void => {
  const argv = process.argv.slice(2);
  const command = argv[0];

  if (!command || command === "-h" || command === "--help") {
    process.stdout.write(USAGE);
    return;
  }

  const file = argv[1];
  if (!file) fail(`Missing <file>.\n\n${USAGE}`);

  let source: string;
  try {
    source = read(file);
  } catch {
    fail(`Could not read ${file}`);
    return;
  }

  const parsed = parseTheme(source);
  if (!parsed.ok || !parsed.colors) {
    fail(`Could not parse tokens from ${file}: ${parsed.error ?? "no colour roles found"}`);
    return;
  }

  const asJson = argv.includes("--json");
  const palette = completePalette(parsed.colors);

  if (command === "check") {
    const requireAaa = (flag(argv, "min") ?? "aa").toLowerCase() === "aaa";
    const { rows } = auditPalette(palette);
    const failures = rows.filter((r) =>
      requireAaa ? r.rating.level !== "aaa" : !r.rating.pass,
    );

    if (asJson) {
      process.stdout.write(
        `${JSON.stringify(
          {
            file,
            passed: failures.length === 0,
            threshold: requireAaa ? "AAA" : "AA",
            missingRoles: parsed.missing,
            rows: rows.map((r) => ({
              label: r.label,
              ratio: Number(r.ratio.toFixed(2)),
              rating: r.rating.label,
              pass: requireAaa ? r.rating.level === "aaa" : r.rating.pass,
            })),
          },
          null,
          2,
        )}\n`,
      );
    } else {
      process.stdout.write(`\n  ${file} — WCAG ${requireAaa ? "AAA" : "AA"}\n\n`);
      for (const row of rows) {
        const ok = requireAaa ? row.rating.level === "aaa" : row.rating.pass;
        const ratio = `${row.ratio.toFixed(2)}:1`.padStart(8);
        process.stdout.write(
          `  ${ok ? "PASS" : "FAIL"}  ${row.label.padEnd(18)}${ratio}  ${row.rating.label}\n`,
        );
      }
      if (parsed.missing.length) {
        process.stdout.write(
          `\n  note: no value found for ${parsed.missing.join(", ")} — graded against a default.\n`,
        );
      }
      process.stdout.write(
        failures.length
          ? `\n  ${failures.length} pairing(s) below threshold.\n\n`
          : `\n  All pairings pass.\n\n`,
      );
    }

    // Non-zero exit is the whole point — this is what fails the build.
    process.exit(failures.length ? 1 : 0);
  }

  if (command === "export") {
    const requested = (argv[2] && !argv[2].startsWith("--") ? argv[2] : "css").toLowerCase();
    const lookup: Record<string, ExportFormat> = {
      css: "CSS",
      tailwind: "Tailwind",
      json: "JSON",
      ai: "AI",
    };
    const format = lookup[requested];
    if (!format) fail(`Unknown format "${requested}". Use css, tailwind, json or ai.`);

    const colorFormat = ((flag(argv, "format") ?? "hex").toUpperCase() as ColorFormat) ?? "HEX";
    const dark = generateVariant(palette, true);

    process.stdout.write(
      `${EXPORTERS[format](palette, dark, parsed.fonts ?? { header: "Inter", body: "Inter" }, {
        colorFormat,
        bothModes: true,
        current: palette,
      })}\n`,
    );
    return;
  }

  fail(`Unknown command "${command}".\n\n${USAGE}`);
};

main();
