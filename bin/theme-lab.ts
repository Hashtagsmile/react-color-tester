#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { auditPalette, auditTokens } from "../src/lib/audit.js";
import { discoverPairs, extractTokens } from "../src/lib/discover.js";
import { parseTheme } from "../src/lib/import.js";
import { EXPORTERS } from "../src/lib/exporters.js";
import { generateVariant } from "../src/lib/theme.js";
import { suggestFixes } from "../src/lib/remediate.js";
import { COLOR_KEYS } from "../src/lib/types.js";
import type { ColorFormat, ExportFormat, Palette } from "../src/lib/types.js";

/**
 * `theme-lab` — the contrast gate.
 *
 * Point it at a stylesheet and it works out the palette and the pairings on its
 * own, by reading which colours the CSS puts on top of which. No config, no
 * five-role model to squeeze a real design system into.
 */

const USAGE = `theme-lab — contrast checking for design tokens

Usage:
  theme-lab check [path]            Grade a stylesheet, directory, or token file
  theme-lab tokens [path]           List every colour token found
  theme-lab export <file> [format]  Convert tokens to css | tailwind | json | ai

Options:
  --min <aa|aaa>    Threshold (default: aa)
  --json            Machine-readable output
  --strict          Also fail on pairings inferred from the page background
  -h, --help

With no path, looks for common stylesheet locations. Reads stdin when path is "-".
Exits 1 when a pairing is below the threshold, so it works as a CI gate.
`;

const CANDIDATES = [
  "src/styles/tokens.css",
  "src/styles/globals.css",
  "src/index.css",
  "src/app/globals.css",
  "app/globals.css",
  "styles/globals.css",
  "src/App.css",
];

const fail = (message: string): never => {
  process.stderr.write(`${message}\n`);
  process.exit(2);
};

const flag = (argv: string[], name: string): string | undefined => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 ? argv[i + 1] : undefined;
};

/** Every .css file under a directory, skipping build output and dependencies. */
const cssFilesIn = (dir: string, depth = 0): string[] => {
  if (depth > 6) return [];
  const skip = new Set(["node_modules", "dist", "build", ".git", ".next", "coverage"]);
  const out: string[] = [];

  for (const entry of readdirSync(dir)) {
    if (skip.has(entry)) continue;
    const full = join(dir, entry);
    try {
      if (statSync(full).isDirectory()) out.push(...cssFilesIn(full, depth + 1));
      else if (extname(entry) === ".css") out.push(full);
    } catch {
      /* unreadable entry — skip rather than abort the run */
    }
  }
  return out;
};

/** Resolve the argument into a list of stylesheet paths, or read stdin. */
const resolveSources = (path: string | undefined): { label: string; css: string }[] => {
  if (path === "-") return [{ label: "stdin", css: readFileSync(0, "utf8") }];

  if (!path) {
    const found = CANDIDATES.filter((c) => existsSync(c));
    if (!found.length) {
      fail(
        `No stylesheet given and none found in the usual places.\n` +
          `Tried: ${CANDIDATES.join(", ")}\n\nPass a path: theme-lab check path/to/tokens.css`,
      );
    }
    return found.map((f) => ({ label: f, css: readFileSync(f, "utf8") }));
  }

  if (!existsSync(path)) fail(`No such file or directory: ${path}`);

  if (statSync(path).isDirectory()) {
    const files = cssFilesIn(path);
    if (!files.length) fail(`No .css files under ${path}`);
    return files.map((f) => ({ label: relative(process.cwd(), f), css: readFileSync(f, "utf8") }));
  }

  return [{ label: path, css: readFileSync(path, "utf8") }];
};

const pad = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s.padEnd(n));

/** One line, first selector only — a grouped rule shouldn't wreck the table. */
const shortSelector = (selector: string): string => {
  const parts = selector.split(",").map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  if (!parts.length) return selector.replace(/\s+/g, " ").trim();
  return parts.length > 1 ? `${parts[0]} +${parts.length - 1} more` : parts[0];
};

/* ------------------------------------------------------------------ */
/*  check                                                             */
/* ------------------------------------------------------------------ */

const runCheck = (argv: string[], path: string | undefined): never => {
  const sources = resolveSources(path);
  const level = (flag(argv, "min") ?? "aa").toLowerCase() === "aaa" ? "AAA" : "AA";
  const asJson = argv.includes("--json");
  const strict = argv.includes("--strict");

  // One combined stylesheet: tokens are usually declared in one file and used in
  // another, so grading files in isolation would resolve almost nothing.
  const combined = sources.map((s) => s.css).join("\n");
  const tokens = extractTokens(combined);
  const pairs = discoverPairs(combined);

  // Fall back to the five-role model when a file declares a palette but never
  // uses it — a bare token file has no rules to learn pairings from.
  if (!pairs.length) {
    const parsed = parseTheme(combined);
    if (parsed.ok && parsed.colors && parsed.matched.length >= 2) {
      const palette = { ...parsed.colors } as Palette;
      for (const key of COLOR_KEYS) {
        if (!palette[key]) palette[key] = key === "background" ? "#ffffff" : "#000000";
      }
      const result = auditPalette(palette);
      const failures = result.failures;

      if (asJson) {
        process.stdout.write(
          `${JSON.stringify(
            {
              files: sources.map((s) => s.label),
              mode: "five-role-fallback",
              passed: !failures.length,
              rows: result.rows.map((r) => ({
                label: r.label,
                ratio: Number(r.ratio.toFixed(2)),
                rating: r.rating.label,
                passes: r.rating.pass,
              })),
            },
            null,
            2,
          )}\n`,
        );
      } else {
        process.stdout.write(
          `\n  ${sources.map((s) => s.label).join(", ")}\n` +
            `  No rules to learn pairings from — grading the five standard roles.\n\n`,
        );
        for (const row of result.rows) {
          process.stdout.write(
            `  ${row.rating.pass ? "PASS" : "FAIL"}  ${pad(row.label, 18)}${`${row.ratio.toFixed(2)}:1`.padStart(9)}  ${row.rating.label}\n`,
          );
        }
        const fixes = suggestFixes(palette);
        if (fixes.length) {
          process.stdout.write(`\n  Suggested:\n`);
          for (const f of fixes) {
            process.stdout.write(
              `    ${pad(f.role, 12)} ${f.from} → ${f.to}  (${f.ratio.toFixed(2)}:1)\n`,
            );
          }
        }
        process.stdout.write(
          failures.length ? `\n  ${failures.length} below ${level}.\n\n` : `\n  All pairings pass.\n\n`,
        );
      }
      process.exit(failures.length ? 1 : 0);
    }

    fail(
      `Found no colour pairings and no recognisable palette in ${sources
        .map((s) => s.label)
        .join(", ")}.`,
    );
  }

  const result = auditTokens(tokens, pairs, level);
  const counted = strict ? result.failures : result.failures.filter((r) => r.origin === "rule");
  const inferredOnly = result.failures.filter((r) => r.origin === "implied");

  if (asJson) {
    process.stdout.write(
      `${JSON.stringify(
        {
          files: sources.map((s) => s.label),
          mode: "discovered",
          threshold: level,
          tokensFound: Object.keys(tokens).length,
          pairingsFound: result.rows.length,
          passed: counted.length === 0,
          rows: result.rows.map((r) => ({
            foreground: r.foreground,
            background: r.background,
            selector: r.selector,
            large: r.large,
            origin: r.origin,
            ratio: Number(r.ratio.toFixed(2)),
            rating: r.rating.label,
            passes: r.passes,
          })),
          unresolved: result.unresolved.map((u) => `${u.foreground} on ${u.background}`),
        },
        null,
        2,
      )}\n`,
    );
    process.exit(counted.length ? 1 : 0);
  }

  const files = sources.map((s) => s.label).join(", ");
  process.stdout.write(
    `\n  ${files}\n` +
      `  ${Object.keys(tokens).length} colour tokens · ${result.rows.length} pairings found in your CSS · WCAG ${level}\n\n`,
  );

  const sorted = [...result.rows].sort((a, b) => Number(a.passes) - Number(b.passes) || a.ratio - b.ratio);
  for (const row of sorted) {
    const mark = row.passes ? "PASS" : row.origin === "implied" && !strict ? "WARN" : "FAIL";
    const size = row.large ? "large" : "body";
    process.stdout.write(
      `  ${mark}  ${pad(`${row.foreground} on ${row.background}`, 40)}${`${row.ratio.toFixed(2)}:1`.padStart(9)}  ${pad(size, 6)} ${shortSelector(row.selector)}\n`,
    );
  }

  if (result.unresolved.length) {
    process.stdout.write(
      `\n  ${result.unresolved.length} pairing(s) skipped — token not defined or not a colour:\n`,
    );
    for (const u of result.unresolved.slice(0, 5)) {
      process.stdout.write(`    ${u.foreground} on ${u.background}  (${shortSelector(u.selector)})\n`);
    }
  }

  if (inferredOnly.length && !strict) {
    process.stdout.write(
      `\n  ${inferredOnly.length} inferred pairing(s) also fail. These come from rules that set\n` +
        `  only a text colour, so the surface is a guess. Re-run with --strict to enforce them.\n`,
    );
  }

  if (counted.length) {
    process.stdout.write(`\n  ${counted.length} pairing(s) below ${level}.\n\n`);
  } else if (inferredOnly.length) {
    // Don't claim a clean sheet while warnings are on screen — the run passes
    // because inferred pairings aren't enforced, not because nothing failed.
    process.stdout.write(
      `\n  No confirmed pairing is below ${level}. ` +
        `${inferredOnly.length} inferred one(s) are — not enforced.\n\n`,
    );
  } else {
    process.stdout.write(`\n  All ${result.rows.length} pairings pass ${level}.\n\n`);
  }

  process.exit(counted.length ? 1 : 0);
};

/* ------------------------------------------------------------------ */
/*  tokens                                                            */
/* ------------------------------------------------------------------ */

const runTokens = (argv: string[], path: string | undefined): never => {
  const sources = resolveSources(path);
  const tokens = extractTokens(sources.map((s) => s.css).join("\n"));
  const names = Object.keys(tokens).sort();

  if (argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(tokens, null, 2)}\n`);
  } else {
    process.stdout.write(`\n  ${names.length} colour tokens\n\n`);
    for (const name of names) process.stdout.write(`  ${pad(name, 34)} ${tokens[name]}\n`);
    process.stdout.write("\n");
  }
  process.exit(0);
};

/* ------------------------------------------------------------------ */

const main = (): void => {
  const argv = process.argv.slice(2);
  const command = argv[0];

  if (!command || command === "-h" || command === "--help") {
    process.stdout.write(USAGE);
    return;
  }

  const path = argv[1] && !argv[1].startsWith("--") ? argv[1] : undefined;

  if (command === "check") runCheck(argv, path);
  if (command === "tokens") runTokens(argv, path);

  if (command === "export") {
    if (!path) fail(`Missing <file>.\n\n${USAGE}`);
    const parsed = parseTheme(readFileSync(path === "-" ? 0 : path!, "utf8"));
    if (!parsed.ok || !parsed.colors) fail(`Could not parse a palette from ${path}`);

    const palette = { ...parsed.colors } as Palette;
    for (const key of COLOR_KEYS) {
      if (!palette[key]) palette[key] = key === "background" ? "#ffffff" : "#000000";
    }

    const requested = (argv[2] && !argv[2].startsWith("--") ? argv[2] : "css").toLowerCase();
    const lookup: Record<string, ExportFormat> = {
      css: "CSS",
      tailwind: "Tailwind",
      json: "JSON",
      ai: "AI",
    };
    const format = lookup[requested];
    if (!format) fail(`Unknown format "${requested}". Use css, tailwind, json or ai.`);

    const colorFormat = (flag(argv, "format") ?? "hex").toUpperCase() as ColorFormat;
    process.stdout.write(
      `${EXPORTERS[format](palette, generateVariant(palette, true), parsed.fonts ?? { header: "Inter", body: "Inter" }, {
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
