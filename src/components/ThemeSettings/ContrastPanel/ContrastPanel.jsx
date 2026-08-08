import "./ContrastPanel.css";
import { useState } from "react";
import { LuWand, LuChevronDown, LuLock } from "react-icons/lu";
import { useTheme } from "../../../contexts/useTheme";
import { auditPalette, suggestFix } from "../../../lib";

/**
 * Renders the shared contrast audit. The pairings and the grading live in
 * `lib/audit` so this panel, the `theme-lab check` CLI and the MCP server can't
 * disagree about whether a palette passes.
 *
 * A verdict on its own isn't much use, so each failing row explains what the
 * pairing is for and offers the smallest colour change that clears it.
 */
export const ContrastPanel = () => {
  const { colors, locked, setColor, fixContrast } = useTheme();
  const { rows, failures } = auditPalette(colors);
  const [expanded, setExpanded] = useState(null);

  const fixable = failures
    .map((row) => suggestFix(colors, row, locked))
    .filter(Boolean);

  return (
    <div className="contrast-panel">
      <p className="contrast-intro">
        WCAG 2.1 contrast for the pairings this theme renders. Aim for{" "}
        <strong>AA</strong> (4.5:1) on body text.
      </p>

      {failures.length > 0 && (
        <div className="contrast-summary">
          <div className="contrast-summary-text">
            <strong>
              {failures.length} pairing{failures.length === 1 ? "" : "s"} below AA
            </strong>
            <span>
              {fixable.length > 0
                ? "Text at these ratios is hard to read in bright light or on a cheap screen."
                : "Every colour that could be adjusted is locked — unlock one to fix this."}
            </span>
          </div>
          {fixable.length > 0 && (
            <button className="contrast-fixall" onClick={fixContrast}>
              <LuWand /> Fix all
            </button>
          )}
        </div>
      )}

      <div className="contrast-list">
        {rows.map((row) => {
          const { label, background, resolvedForeground, ratio, rating, why } = row;
          const suggestion = rating.pass ? null : suggestFix(colors, row, locked);
          const isOpen = expanded === label;
          const blockedByLock = !rating.pass && !suggestion;

          return (
            <div className={`contrast-row-wrap ${rating.pass ? "" : "failing"}`} key={label}>
              <button
                className="contrast-row"
                onClick={() => setExpanded(isOpen ? null : label)}
                aria-expanded={isOpen}
              >
                <span
                  className="contrast-sample"
                  style={{ background: colors[background], color: resolvedForeground }}
                  aria-hidden="true"
                >
                  Aa
                </span>
                <span className="contrast-info">
                  <span className="contrast-label">{label}</span>
                  <span className="contrast-ratio">{ratio.toFixed(2)}:1</span>
                </span>
                <span className={`contrast-badge ${rating.level}`}>{rating.label}</span>
                <LuChevronDown className={`contrast-caret ${isOpen ? "open" : ""}`} />
              </button>

              {isOpen && (
                <div className="contrast-detail">
                  <p className="contrast-why">{why}</p>

                  {suggestion && (
                    <div className="contrast-suggestion">
                      <div className="contrast-suggestion-swatches">
                        <span
                          className="contrast-chip"
                          style={{ background: suggestion.from }}
                          aria-hidden="true"
                        />
                        <span className="contrast-arrow" aria-hidden="true">
                          →
                        </span>
                        <span
                          className="contrast-chip"
                          style={{ background: suggestion.to }}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="contrast-suggestion-text">
                        Darken <strong>{suggestion.role}</strong> to{" "}
                        <code>{suggestion.to}</code> — reaches {suggestion.ratio.toFixed(2)}:1.
                        Same hue, just deeper.
                      </div>
                      <button
                        className="contrast-apply"
                        onClick={() => setColor(suggestion.role, suggestion.to)}
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {blockedByLock && (
                    <p className="contrast-blocked">
                      <LuLock /> The colours that would fix this are locked. Unlock{" "}
                      <strong>{row.foreground}</strong> or <strong>{row.background}</strong> to
                      get a suggestion.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
