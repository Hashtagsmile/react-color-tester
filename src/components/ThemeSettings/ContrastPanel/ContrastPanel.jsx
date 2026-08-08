import "./ContrastPanel.css";
import { useTheme } from "../../../contexts/useTheme";
import { auditPalette } from "../../../lib";

/**
 * Renders the shared contrast audit. The pairings and the grading live in
 * `lib/audit` so this panel, the `theme-lab check` CLI and the MCP server can't
 * disagree about whether a palette passes.
 */
export const ContrastPanel = () => {
  const { colors } = useTheme();
  const { rows } = auditPalette(colors);

  return (
    <div className="contrast-panel">
      <p className="contrast-intro">
        WCAG 2.1 contrast for the pairings this theme renders. Aim for{" "}
        <strong>AA</strong> (4.5:1) on body text.
      </p>

      <div className="contrast-list">
        {rows.map(({ label, background, resolvedForeground, ratio, rating }) => (
          <div className="contrast-row" key={label}>
            <div
              className="contrast-sample"
              style={{ background: colors[background], color: resolvedForeground }}
              aria-hidden="true"
            >
              Aa
            </div>
            <div className="contrast-info">
              <span className="contrast-label">{label}</span>
              <span className="contrast-ratio">{ratio.toFixed(2)}:1</span>
            </div>
            <span className={`contrast-badge ${rating.level}`}>{rating.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
