#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative, resolve as resolvePath } from "node:path";
import { auditPalette, auditTokens } from "../src/lib/audit.js";
import { discoverPairs, extractTokens } from "../src/lib/discover.js";
import { applyBaseline, emptyBaseline, pairKey, suggestPairFix } from "../src/lib/gate.js";
import { createRequire } from "node:module";
import {
  discoverClassPairs,
  flattenColors,
  parseTailwindColors,
} from "../src/lib/tailwind.js";
import { discoverStylePairs } from "../src/lib/cssinjs.js";
import { parseTheme } from "../src/lib/import.js";
import { EXPORTERS } from "../src/lib/exporters.js";
import { generateVariant } from "../src/lib/theme.js";
import { suggestFixes } from "../src/lib/remediate.js";
import { COLOR_KEYS } from "../src/lib/types.js";
import type { TokenAuditRow } from "../src/lib/audit.js";
import type { DiscoveredPair, TokenMap } from "../src/lib/discover.js";
import type { Baseline } from "../src/lib/gate.js";
import type { ColorFormat, ExportFormat, Palette } from "../src/lib/types.js";

/**
 * `theme-lab` — the contrast gate.
 *
 * Point it at a project and it works out the palette and the pairings on its
 * own, by reading which colours the CSS puts on top of which. Adoption is the
 * hard part for a checker like this, so it ships with a baseline: record what's
 * already broken, then fail only on regressions.
 */

const USAGE = `theme-lab — contrast checking for design tokens

Usage:
  theme-lab check [path]            Grade a project, directory or stylesheet
  theme-lab baseline [path]         Accept current failures; future runs gate on regressions
  theme-lab tokens [path]           List every colour token found
  theme-lab export <file> [format]  Convert tokens to css | tailwind | json | ai

Options:
  --min <aa|aaa>    Threshold (default: aa)
  --strict          Also enforce pairings whose surface was inferred
  --json            Machine-readable output
  --no-baseline     Ignore the baseline file for this run
  --no-tailwind     Skip Tailwind config and class-list scanning
  --no-css-in-js    Skip styled-components / Emotion / style-object scanning
  -h, --help

Config is optional: themelab.config.json, .themelabrc.json, or a "themeLab"
key in package.json. Reads stdin when path is "-".
Exits 1 on a new failure, so it works as a CI gate.
`;

const STYLE_EXTS = new Set([".css", ".scss", ".sass", ".less"]);
const MARKUP_EXTS = new Set([".jsx", ".tsx", ".html", ".vue", ".svelte", ".astro"]);
const SCRIPT_EXTS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs"]);
const TAILWIND_CONFIGS = [
  "tailwind.config.js",
  "tailwind.config.cjs",
  "tailwind.config.mjs",
  "tailwind.config.ts",
];
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "dist-node",
  "build",
  ".git",
  ".next",
  ".nuxt",
  ".svelte-kit",
  "coverage",
  "vendor",
]);

const CANDIDATE_DIRS = ["src", "app", "styles", "assets"];
const BASELINE_FILE = ".themelab-baseline.json";
const CONFIG_FILES = ["themelab.config.json", ".themelabrc.json"];

interface Config {
  include?: string[];
  level?: "AA" | "AAA";
  strict?: boolean;
  ignore?: string[];
  pairs?: DiscoveredPair[];
}

const fail: (message: string) => never = (message) => {
  process.stderr.write(`${message}\n`);
  process.exit(2);
};

const flag = (argv: string[], name: string): string | undefined => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 ? argv[i + 1] : undefined;
};

const readJson = <T>(path: string): T | null => {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
};

const loadConfig = (): Config => {
  for (const file of CONFIG_FILES) {
    if (existsSync(file)) {
      const cfg = readJson<Config>(file);
      if (cfg) return cfg;
      fail(`${file} is not valid JSON.`);
    }
  }
  const pkg = readJson<{ themeLab?: Config }>("package.json");
  return pkg?.themeLab ?? {};
};

/** Files with a matching extension, skipping build output and dependencies. */
const filesIn = (dir: string, exts: Set<string>, depth = 0): string[] => {
  if (depth > 8) return [];
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry) || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    try {
      if (statSync(full).isDirectory()) out.push(...filesIn(full, exts, depth + 1));
      else if (exts.has(extname(entry))) out.push(full);
    } catch {
      /* unreadable entry — skip rather than abort the whole run */
    }
  }
  return out;
};

const styleFilesIn = (dir: string) => filesIn(dir, STYLE_EXTS);

/**
 * Tailwind's default palette, read from the project's own install.
 *
 * Not a hardcoded copy: ~240 hex values would drift from whatever version is
 * actually installed, and a wrong hex means a wrong verdict. If Tailwind isn't
 * resolvable we say so and grade only what the config defines.
 */
const resolveTailwindDefaults = (): TokenMap | null => {
  // Tailwind logs deprecation warnings (`lightBlue` -> `sky`) on import. Those
  // would land in the middle of the report and, worse, corrupt --json output.
  const saved = { warn: console.warn, log: console.log, error: console.error };
  console.warn = console.log = console.error = () => {};

  try {
    const req = createRequire(join(process.cwd(), "package.json"));
    return flattenColors(req("tailwindcss/colors"));
  } catch {
    return null;
  } finally {
    Object.assign(console, saved);
  }
};

const resolveSources = (
  path: string | undefined,
  config: Config,
  /** When true, return [] instead of exiting if nothing matches — a Tailwind
   *  project can legitimately have no stylesheets at all. */
  soft = false,
): { label: string; css: string }[] => {
  if (path === "-") return [{ label: "stdin", css: readFileSync(0, "utf8") }];

  const read = (files: string[]) =>
    files.map((f) => ({ label: relative(process.cwd(), f) || f, css: readFileSync(f, "utf8") }));

  if (path) {
    if (!existsSync(path)) fail(`No such file or directory: ${path}`);
    if (statSync(path).isDirectory()) {
      const files = styleFilesIn(path);
      if (!files.length) {
        if (soft) return [];
        fail(`No stylesheets found under ${path}`);
      }
      return read(files);
    }
    return read([path]);
  }

  if (config.include?.length) {
    const files = config.include.flatMap((p) =>
      existsSync(p) && statSync(p).isDirectory() ? styleFilesIn(p) : existsSync(p) ? [p] : [],
    );
    if (!files.length) {
      if (soft) return [];
      fail(`Nothing matched "include" in your config.`);
    }
    return read(files);
  }

  // No path and no config: scan the usual source roots.
  const files = CANDIDATE_DIRS.filter((d) => existsSync(d)).flatMap((d) => styleFilesIn(d));
  if (!files.length) {
    if (soft) return [];
    fail(
      `No stylesheets found in ${CANDIDATE_DIRS.join(", ")}.\n\n` +
        `Pass a path:  theme-lab check path/to/styles\n` +
        `Or add "include" to themelab.config.json.`,
    );
  }
  return read(files);
};

const pad = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s.padEnd(n));

/** A literal colour is written as-is; a custom property gets its `--` back. */
const tokenLabel = (token: string): string => (token.startsWith("#") ? token : `--${token}`);

/** One line, first selector only — a grouped rule shouldn't wreck the table. */
const shortSelector = (selector: string): string => {
  const parts = selector
    .split(",")
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (!parts.length) return selector.replace(/\s+/g, " ").trim();
  return parts.length > 1 ? `${parts[0]} +${parts.length - 1} more` : parts[0];
};

/** "24 stylesheets" beats a 2000-character list of paths. */
const describeSources = (sources: { label: string }[]): string =>
  sources.length === 1 ? sources[0].label : `${sources.length} stylesheets`;

const renderRow = (mark: string, r: TokenAuditRow) =>
  `  ${pad(mark, 5)} ${pad(`${r.foreground} on ${r.background}`, 38)}${`${r.ratio.toFixed(2)}:1`.padStart(9)}  ${pad(r.large ? "large" : "body", 6)} ${shortSelector(r.selector)}\n`;

/* ------------------------------------------------------------------ */
/*  Shared analysis                                                   */
/* ------------------------------------------------------------------ */

interface TailwindScan {
  configFile: string;
  tokens: TokenMap;
  pairs: DiscoveredPair[];
  markupFiles: number;
  defaultsResolved: boolean;
}

/**
 * Tailwind keeps colours in a config and pairings in markup, so both are read.
 * A class list carrying both `text-*` and `bg-*` is the same signal as a CSS
 * rule setting `color` and `background`.
 */
const scanTailwind = (roots: string[]): TailwindScan | null => {
  const configFile = TAILWIND_CONFIGS.find((f) => existsSync(f));
  if (!configFile) return null;

  const defaults = resolveTailwindDefaults();
  const configured = parseTailwindColors(readFileSync(configFile, "utf8"));
  const tokens: TokenMap = { ...(defaults ?? {}), ...configured };

  const markupFiles = roots
    .filter((d) => existsSync(d))
    .flatMap((d) => filesIn(d, MARKUP_EXTS));

  const pairs = markupFiles.flatMap((file) =>
    discoverClassPairs(readFileSync(file, "utf8"), { label: relative(process.cwd(), file) }),
  );

  // Same pairing across many components is one thing to fix.
  const seen = new Set<string>();
  const deduped = pairs.filter((p) => {
    const key = `${p.foreground}|${p.background}|${p.large}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    configFile,
    tokens,
    pairs: deduped,
    markupFiles: markupFiles.length,
    defaultsResolved: defaults !== null,
  };
};

/**
 * styled-components, Emotion, vanilla-extract and inline style objects express
 * the same thing as a CSS rule, in JavaScript. Literal colours become their own
 * token name, so `#ffffff on #6366f1` reads sensibly in the report.
 */
const scanStyles = (roots: string[]) => {
  const files = roots.filter((d) => existsSync(d)).flatMap((d) => filesIn(d, SCRIPT_EXTS));

  const pairs: DiscoveredPair[] = [];
  const tokens: TokenMap = {};

  for (const file of files) {
    const scan = discoverStylePairs(
      readFileSync(file, "utf8"),
      relative(process.cwd(), file),
    );
    pairs.push(...scan.pairs);
    Object.assign(tokens, scan.tokens);
  }

  const seen = new Set<string>();
  const deduped = pairs.filter((p) => {
    const key = `${p.foreground}|${p.background}|${p.large}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { pairs: deduped, tokens, files: files.length };
};

const analyse = (argv: string[], path: string | undefined, config: Config) => {
  const level: "AA" | "AAA" =
    (flag(argv, "min") ?? config.level ?? "aa").toLowerCase() === "aaa" ? "AAA" : "AA";
  const strict = argv.includes("--strict") || config.strict === true;

  const roots = path ? [path] : (config.include ?? CANDIDATE_DIRS);
  const tailwind = argv.includes("--no-tailwind") ? null : scanTailwind(roots);
  const styles = argv.includes("--no-css-in-js")
    ? { pairs: [], tokens: {}, files: 0 }
    : scanStyles(roots);

  // A Tailwind project may have no stylesheets at all, so a missing one isn't
  // fatal once we've found a config.
  const sources = resolveSources(path, config, tailwind !== null || styles.pairs.length > 0);

  // One combined stylesheet: tokens are usually declared in one file and used
  // in another, so grading files in isolation would resolve almost nothing.
  const combined = sources.map((s) => s.css).join("\n");
  const tokens = { ...extractTokens(combined), ...(tailwind?.tokens ?? {}), ...styles.tokens };
  const pairs = [
    ...discoverPairs(combined),
    ...(tailwind?.pairs ?? []),
    ...styles.pairs,
    ...(config.pairs ?? []),
  ];

  return { sources, level, strict, combined, tokens, pairs, tailwind, styles };
};

/* ------------------------------------------------------------------ */
/*  Five-role fallback — a token file with no rules to learn from     */
/* ------------------------------------------------------------------ */

const runFallback = (
  combined: string,
  sources: { label: string }[],
  level: "AA" | "AAA",
  asJson: boolean,
): never => {
  const parsed = parseTheme(combined);
  if (!parsed.ok || !parsed.colors || parsed.matched.length < 2) {
    fail(
      `Found no colour pairings and no recognisable palette in ${describeSources(sources)}.\n` +
        `Tokens have to be used in a rule for their pairings to be discoverable.`,
    );
  }

  const palette = { ...parsed.colors } as Palette;
  for (const key of COLOR_KEYS) {
    if (!palette[key]) palette[key] = key === "background" ? "#ffffff" : "#000000";
  }

  const result = auditPalette(palette);

  if (asJson) {
    process.stdout.write(
      `${JSON.stringify(
        {
          mode: "five-role-fallback",
          passed: result.passed,
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
      `\n  ${describeSources(sources)}\n` +
        `  No rules to learn pairings from — grading the five standard roles.\n\n`,
    );
    for (const r of result.rows) {
      process.stdout.write(
        `  ${pad(r.rating.pass ? "PASS" : "FAIL", 5)} ${pad(r.label, 18)}${`${r.ratio.toFixed(2)}:1`.padStart(9)}  ${r.rating.label}\n`,
      );
    }
    for (const f of suggestFixes(palette)) {
      process.stdout.write(
        `        → set ${f.role} to ${f.to} (from ${f.from}) for ${f.ratio.toFixed(2)}:1\n`,
      );
    }
    process.stdout.write(
      result.passed
        ? `\n  All pairings pass.\n\n`
        : `\n  ${result.failures.length} below ${level}.\n\n`,
    );
  }
  process.exit(result.passed ? 0 : 1);
};

/* ------------------------------------------------------------------ */
/*  check                                                             */
/* ------------------------------------------------------------------ */

const runCheck = (argv: string[], path: string | undefined, config: Config): never => {
  const { sources, level, strict, combined, tokens, pairs, tailwind, styles } = analyse(argv, path, config);
  const asJson = argv.includes("--json");

  if (!pairs.length) runFallback(combined, sources, level, asJson);

  const result = auditTokens(tokens, pairs, level);
  const enforceable = strict
    ? result.failures
    : result.failures.filter((r) => r.origin === "rule");
  const inferred = result.failures.filter((r) => r.origin === "implied");

  const baseline =
    argv.includes("--no-baseline") || !existsSync(BASELINE_FILE)
      ? emptyBaseline()
      : (readJson<Baseline>(BASELINE_FILE) ?? emptyBaseline());

  const { fresh, known, fixed } = applyBaseline(enforceable, baseline, config.ignore ?? []);

  if (asJson) {
    process.stdout.write(
      `${JSON.stringify(
        {
          mode: "discovered",
          files: sources.map((s) => s.label),
          threshold: level,
          tokensFound: Object.keys(tokens).length,
          pairingsFound: result.rows.length,
          tailwind: tailwind
            ? {
                config: tailwind.configFile,
                markupFiles: tailwind.markupFiles,
                defaultPaletteResolved: tailwind.defaultsResolved,
              }
            : null,
          passed: fresh.length === 0,
          newFailures: fresh.map((r) => ({
            key: pairKey(r),
            selector: shortSelector(r.selector),
            ratio: Number(r.ratio.toFixed(2)),
            suggestion: suggestPairFix(tokens, r, level),
          })),
          knownFailures: known.map((r) => pairKey(r)),
          fixedSinceBaseline: fixed,
          inferredFailures: inferred.map((r) => pairKey(r)),
          unresolved: result.unresolved.map((u) => `${u.foreground} on ${u.background}`),
        },
        null,
        2,
      )}\n`,
    );
    process.exit(fresh.length ? 1 : 0);
  }

  const scanned = [
    sources.length ? describeSources(sources) : null,
    tailwind ? `${tailwind.configFile} + ${tailwind.markupFiles} markup files` : null,
    styles.pairs.length ? `CSS-in-JS in ${styles.files} files` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  process.stdout.write(
    `\n  ${scanned}\n` +
      `  ${Object.keys(tokens).length} colour tokens · ${result.rows.length} pairings discovered · WCAG ${level}\n\n`,
  );

  if (tailwind && !tailwind.defaultsResolved) {
    process.stdout.write(
      `  Note: couldn't resolve tailwindcss/colors from this project, so only\n` +
        `  colours defined in ${tailwind.configFile} were graded.\n\n`,
    );
  }

  const freshKeys = new Set(fresh.map(pairKey));
  const knownKeys = new Set(known.map(pairKey));
  const sorted = [...result.rows].sort(
    (a, b) => Number(a.passes) - Number(b.passes) || a.ratio - b.ratio,
  );

  for (const r of sorted) {
    const key = pairKey(r);
    const mark = freshKeys.has(key)
      ? "FAIL"
      : knownKeys.has(key)
        ? "KNOWN"
        : r.passes
          ? "PASS"
          : "WARN";
    process.stdout.write(renderRow(mark, r));

    if (freshKeys.has(key)) {
      const s = suggestPairFix(tokens, r, level);
      if (s) {
        process.stdout.write(
          `        → set ${tokenLabel(s.token)} to ${s.to} (from ${s.from}) for ${s.ratio.toFixed(2)}:1\n`,
        );
      }
    }
  }

  if (result.unresolved.length) {
    process.stdout.write(
      `\n  ${result.unresolved.length} pairing(s) skipped — token undefined, non-colour, or transparent.\n`,
    );
  }
  if (known.length) {
    process.stdout.write(
      `\n  ${known.length} known failure(s) from ${BASELINE_FILE} — not gating.\n`,
    );
  }
  if (fixed.length) {
    process.stdout.write(
      `  ${fixed.length} baseline entr${fixed.length === 1 ? "y no longer fails" : "ies no longer fail"}. ` +
        `Run \`theme-lab baseline\` to prune.\n`,
    );
  }
  if (inferred.length && !strict) {
    process.stdout.write(
      `\n  ${inferred.length} inferred pairing(s) also fail. Their surface is a guess from an\n` +
        `  ancestor selector, so they don't gate — use --strict to enforce them.\n`,
    );
  }

  if (fresh.length) {
    process.stdout.write(`\n  ${fresh.length} new failure(s) below ${level}.\n\n`);
  } else if (inferred.length || known.length) {
    process.stdout.write(`\n  No new failures below ${level}.\n\n`);
  } else {
    process.stdout.write(`\n  All ${result.rows.length} pairings pass ${level}.\n\n`);
  }

  process.exit(fresh.length ? 1 : 0);
};

/* ------------------------------------------------------------------ */
/*  baseline                                                          */
/* ------------------------------------------------------------------ */

const runBaseline = (argv: string[], path: string | undefined, config: Config): never => {
  const { sources, level, strict, tokens, pairs } = analyse(argv, path, config);
  if (!pairs.length) {
    fail(`No pairings discovered in ${describeSources(sources)} — nothing to baseline.`);
  }

  const result = auditTokens(tokens, pairs, level);
  const enforceable = strict
    ? result.failures
    : result.failures.filter((r) => r.origin === "rule");

  const previous = existsSync(BASELINE_FILE) ? readJson<Baseline>(BASELINE_FILE) : null;
  const accepted = [...new Set(enforceable.map(pairKey))].sort();

  writeFileSync(BASELINE_FILE, `${JSON.stringify({ accepted }, null, 2)}\n`);

  process.stdout.write(
    `\n  Wrote ${BASELINE_FILE} — ${accepted.length} accepted failure(s)` +
      (previous ? ` (was ${previous.accepted.length})` : "") +
      `.\n  Future runs fail only on new ones. Commit this file.\n\n`,
  );
  process.exit(0);
};

/* ------------------------------------------------------------------ */
/*  tokens                                                            */
/* ------------------------------------------------------------------ */

const runTokens = (argv: string[], path: string | undefined, config: Config): never => {
  const { sources, tokens } = analyse(argv, path, config);
  const names = Object.keys(tokens).sort();

  if (argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(tokens, null, 2)}\n`);
  } else {
    process.stdout.write(`\n  ${describeSources(sources)} · ${names.length} colour tokens\n\n`);
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
  const config = loadConfig();

  if (command === "check") runCheck(argv, path, config);
  if (command === "baseline") runBaseline(argv, path, config);
  if (command === "tokens") runTokens(argv, path, config);

  if (command === "export") {
    if (!path) fail(`Missing <file>.\n\n${USAGE}`);
    const parsed = parseTheme(readFileSync(path === "-" ? 0 : resolvePath(path), "utf8"));
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
      `${EXPORTERS[format](
        palette,
        generateVariant(palette, true),
        parsed.fonts ?? { header: "Inter", body: "Inter" },
        { colorFormat, bothModes: true, current: palette },
      )}\n`,
    );
    return;
  }

  fail(`Unknown command "${command}".\n\n${USAGE}`);
};

main();
