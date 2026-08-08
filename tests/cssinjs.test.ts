import { describe, expect, it } from "vitest";
import {
  discoverStylePairs,
  extractStyleObjects,
  extractStyleTemplates,
} from "../src/lib/cssinjs";

const STYLED = `
import styled, { css, createGlobalStyle } from "styled-components";

const Button = styled.button\`
  color: #ffffff;
  background: #6366f1;
  padding: 8px 16px;
\`;

const Card = styled(Panel)\`
  color: var(--text-muted);
  background-color: var(--surface-raised);
  font-size: 0.8rem;
\`;

const Heading = styled.h1\`
  color: #94a3b8;
  background: #ffffff;
  font-size: 2rem;
\`;

const Themed = styled.span\`
  color: \${(p) => p.theme.text};
  background: #ffffff;
\`;

const Global = createGlobalStyle\`
  body { color: #0f172a; background: #ffffff; }
\`;
`;

describe("extractStyleTemplates", () => {
  it("finds styled, styled(Component), and createGlobalStyle bodies", () => {
    const bodies = extractStyleTemplates(STYLED);
    expect(bodies.length).toBeGreaterThanOrEqual(5);
    expect(bodies.some((b) => b.includes("#6366f1"))).toBe(true);
    expect(bodies.some((b) => b.includes("createGlobalStyle") === false)).toBe(true);
  });

  it("replaces interpolations rather than choking on their braces", () => {
    const body = extractStyleTemplates(STYLED).find((b) => b.includes("__EXPR__"));
    expect(body).toBeTruthy();
    expect(body).not.toContain("p.theme.text");
  });

  it("handles a generic type argument on the tag", () => {
    const bodies = extractStyleTemplates("const A = styled.div<Props>`color: #fff; background: #000;`;");
    expect(bodies).toHaveLength(1);
  });
});

describe("extractStyleObjects", () => {
  it("reads an inline style object", () => {
    const objects = extractStyleObjects(`<div style={{ color: "#fff", backgroundColor: "#000" }} />`);
    expect(objects[0]["color"]).toBe("#fff");
    expect(objects[0]["background-color"]).toBe("#000");
  });

  it("reads vanilla-extract style() calls", () => {
    const objects = extractStyleObjects(
      `export const chip = style({ color: "#0f172a", background: "#f1f5f9", fontSize: "13px" });`,
    );
    expect(objects[0]["color"]).toBe("#0f172a");
    expect(objects[0]["font-size"]).toBe("13px");
  });

  it("ignores objects with no colour properties", () => {
    expect(extractStyleObjects(`const a = { margin: "0", padding: "4px" };`)).toHaveLength(0);
  });
});

describe("discoverStylePairs", () => {
  const { pairs, tokens } = discoverStylePairs(STYLED, "Button.tsx");
  const find = (fg: string, bg: string) =>
    pairs.find((p) => p.foreground === fg && p.background === bg);

  it("pairs literal colours from a styled template", () => {
    const p = find("#ffffff", "#6366f1");
    expect(p?.origin).toBe("rule");
  });

  it("registers literals as their own tokens so the audit can resolve them", () => {
    expect(tokens["#6366f1"]).toBe("#6366f1");
    expect(tokens["#ffffff"]).toBe("#ffffff");
  });

  it("resolves var() references to token names, not literals", () => {
    const p = find("text-muted", "surface-raised");
    expect(p).toBeTruthy();
    expect(tokens["text-muted"]).toBeUndefined();
  });

  it("reads the large-text threshold from the same block", () => {
    expect(find("#94a3b8", "#ffffff")?.large).toBe(true);
  });

  it("skips a declaration whose value comes from an interpolation", () => {
    // `color: ${p => p.theme.text}` can't be resolved without running the app.
    expect(pairs.some((p) => p.foreground.includes("EXPR"))).toBe(false);
  });

  it("picks up nested rules inside createGlobalStyle", () => {
    expect(find("#0f172a", "#ffffff")).toBeTruthy();
  });

  it("leaves a lone text colour alone", () => {
    // In CSS-in-JS the surface usually comes from a different component;
    // guessing would manufacture failures nobody can act on.
    const { pairs } = discoverStylePairs("const A = styled.p`color: #94a3b8;`;");
    expect(pairs).toHaveLength(0);
  });

  it("finds nothing in a file with no styles", () => {
    const { pairs, tokens } = discoverStylePairs(`export const add = (a, b) => a + b;`);
    expect(pairs).toHaveLength(0);
    expect(Object.keys(tokens)).toHaveLength(0);
  });

  it("deduplicates the same pairing repeated across components", () => {
    const { pairs } = discoverStylePairs(`
      const A = styled.p\`color: #94a3b8; background: #ffffff;\`;
      const B = styled.span\`color: #94a3b8; background: #ffffff;\`;
    `);
    expect(pairs).toHaveLength(1);
  });
});
