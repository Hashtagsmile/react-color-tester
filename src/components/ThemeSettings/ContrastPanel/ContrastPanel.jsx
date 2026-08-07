import "./ContrastPanel.css";
import { useTheme } from "../../../contexts/useTheme";
import { contrastRatio, contrastRating } from "../../../utilities/utilities";

// Each row checks a real-world pairing the preview actually renders.
const PAIRS = [
  { label: "Body text", fg: "text", bg: "background", large: false },
  { label: "Headings", fg: "primary", bg: "background", large: true },
  { label: "Button label", fg: "background", bg: "primary", large: false },
  { label: "Accent on bg", fg: "accent", bg: "background", large: true },
  { label: "Secondary on bg", fg: "secondary", bg: "background", large: true },
];

export const ContrastPanel = () => {
  const { colors } = useTheme();

  return (
    <div className="contrast-panel">
      <p className="contrast-intro">
        WCAG 2.1 contrast for the pairings this theme renders. Aim for{" "}
        <strong>AA</strong> (4.5:1) on body text.
      </p>

      <div className="contrast-list">
        {PAIRS.map(({ label, fg, bg, large }) => {
          const ratio = contrastRatio(colors[fg], colors[bg]);
          const rating = contrastRating(ratio, large);
          return (
            <div className="contrast-row" key={label}>
              <div
                className="contrast-sample"
                style={{ background: colors[bg], color: colors[fg] }}
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
          );
        })}
      </div>
    </div>
  );
};
