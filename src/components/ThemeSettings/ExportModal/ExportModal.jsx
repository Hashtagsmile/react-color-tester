import { useMemo, useState } from "react";
import { LuCopy, LuCheck, LuX, LuDownload, LuSparkles } from "react-icons/lu";
import { useTheme } from "../../../contexts/useTheme";
import { generateVariant } from "../../../utilities/theme";
import { predefinedThemes } from "../../../data/predefinedThemes";
import { EXPORTERS } from "../../../utilities/exporters";
import "./ExportModal.css";

const FORMATS = ["AI", "CSS", "Tailwind", "JSON"];
const COLOR_FORMATS = ["HEX", "RGB", "HSL"];

export const ExportModal = () => {
  const { colors, fonts, isDarkMode, isCustom, themeName } = useTheme();

  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState("AI");
  const [colorFormat, setColorFormat] = useState("HEX");
  const [bothModes, setBothModes] = useState(true);
  const [copied, setCopied] = useState(false);

  // Resolve a concrete light + dark palette for the current theme.
  const { light, dark } = useMemo(() => {
    if (!isCustom) {
      const preset = predefinedThemes.find((t) => t.name === themeName);
      if (preset) return { light: preset.light, dark: preset.dark };
    }
    const other = generateVariant(colors, !isDarkMode);
    return {
      light: isDarkMode ? other : colors,
      dark: isDarkMode ? colors : other,
    };
  }, [colors, isCustom, themeName, isDarkMode]);

  const output = useMemo(() => {
    const current = isDarkMode ? dark : light;
    return EXPORTERS[format](light, dark, fonts, { colorFormat, bothModes, current });
  }, [format, colorFormat, bothModes, light, dark, isDarkMode, fonts]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <>
      <button className="export-open-btn" onClick={() => setOpen(true)}>
        <LuDownload /> Export theme
      </button>

      {open && (
        <div className="export-overlay" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="export-modal" onClick={(e) => e.stopPropagation()}>
            <div className="export-head">
              <h3>Export theme</h3>
              <button className="export-close" onClick={() => setOpen(false)} aria-label="Close">
                <LuX />
              </button>
            </div>

            <div className="export-controls">
              <div className="export-segment" role="tablist" aria-label="Format">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    className={`${format === f ? "on" : ""} ${f === "AI" ? "ai" : ""}`}
                    onClick={() => setFormat(f)}
                  >
                    {f === "AI" && <LuSparkles />}
                    {f === "AI" ? "AI prompt" : f}
                  </button>
                ))}
              </div>

              {format !== "AI" && (
                <div className="export-segment small">
                  {COLOR_FORMATS.map((f) => (
                    <button key={f} className={colorFormat === f ? "on" : ""} onClick={() => setColorFormat(f)}>
                      {f}
                    </button>
                  ))}
                </div>
              )}

              <label className="export-toggle">
                <input type="checkbox" checked={bothModes} onChange={(e) => setBothModes(e.target.checked)} />
                Light&nbsp;+&nbsp;dark
              </label>
            </div>

            {format === "AI" && (
              <p className="export-note">
                <LuSparkles /> Paste straight into Cursor, Claude Code, Copilot or v0 — a labelled
                palette with contrast ratios and ready-to-use tokens.
              </p>
            )}

            <pre className="export-code">{output}</pre>

            {/* Long lines scroll sideways on a phone with no visible scrollbar,
                which reads as truncation. Say so — copying takes it all anyway. */}
            <p className="export-scroll-hint">
              Long lines run off the edge — swipe the code sideways, or just copy it.
            </p>

            <button className="export-copy-btn" onClick={handleCopy}>
              {copied ? <LuCheck /> : <LuCopy />}
              {copied ? "Copied to clipboard" : "Copy code"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
