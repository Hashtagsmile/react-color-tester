import { useCallback, useMemo, useState } from "react";
import { LuClipboardPaste, LuX, LuCheckCircle, LuAlertTriangle } from "react-icons/lu";
import { useTheme } from "../../../contexts/useTheme";
import { useModal } from "../../Modal/useModal";
import { auditPalette, parseTheme } from "../../../lib";
import "./ImportModal.css";

const SAMPLE = `:root {
  --color-primary: #4f46e5;
  --color-secondary: #64748b;
  --color-accent: #f59e0b;
  --color-background: #ffffff;
  --color-text: #0f172a;
}`;

/**
 * Paste tokens in, see them on real UI.
 *
 * Generating a palette is cheap now — an assistant will hand you one in seconds.
 * What it can't do is tell you whether the thing survives contact with a real
 * page. This is the other half of the loop.
 */
export const ImportModal = () => {
  const { colors, importTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const close = useCallback(() => setOpen(false), []);
  const dialogRef = useModal(open, close);

  // Parse as the user types so the verdict updates live.
  const result = useMemo(() => (text.trim() ? parseTheme(text) : null), [text]);

  // Fill any role the paste didn't carry from the current theme, rather than
  // inventing a colour and quietly showing the user something they didn't paste.
  const merged = useMemo(
    () => (result?.ok ? { ...colors, ...result.colors } : null),
    [result, colors],
  );

  const audit = useMemo(() => (merged ? auditPalette(merged) : null), [merged]);

  const apply = () => {
    if (!merged) return;
    importTheme(merged, result.fonts);
    setText("");
    close();
  };

  return (
    <>
      <button className="import-open-btn" onClick={() => setOpen(true)}>
        <LuClipboardPaste /> Import tokens
      </button>

      {open && (
        <div className="import-overlay" onClick={close}>
          <div
            className="import-modal"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="import-head">
              <h3 id="import-title">Import tokens</h3>
              <button className="import-close" onClick={close} aria-label="Close">
                <LuX />
              </button>
            </div>

            <p className="import-note">
              Paste CSS custom properties, a Tailwind config or JSON — whatever your AI
              assistant handed you. Theme Lab renders it on real UI and grades the contrast.
            </p>

            <label className="import-label" htmlFor="import-input">
              Tokens
            </label>
            <textarea
              id="import-input"
              className="import-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={SAMPLE}
              spellCheck="false"
              rows={9}
            />

            {result && !result.ok && (
              <p className="import-status error">
                <LuAlertTriangle /> {result.error}
              </p>
            )}

            {result?.ok && (
              <div className="import-result">
                <p className="import-status ok">
                  <LuCheckCircle />
                  Found {result.matched.length} of 5 roles
                  {result.source ? ` in ${result.source === "css" ? "CSS" : result.source}` : ""}.
                  {result.missing.length > 0 &&
                    ` Keeping your current ${result.missing.join(", ")}.`}
                </p>

                <div className="import-swatches">
                  {Object.entries(merged).map(([role, hex]) => (
                    <div className="import-swatch" key={role}>
                      <span
                        className={`import-chip ${result.missing.includes(role) ? "inherited" : ""}`}
                        style={{ background: hex }}
                      />
                      <span className="import-role">{role}</span>
                      <span className="import-hex">{hex}</span>
                    </div>
                  ))}
                </div>

                <div className={`import-verdict ${audit.passed ? "pass" : "fail"}`}>
                  {audit.passed ? (
                    <>
                      <LuCheckCircle /> Every pairing passes WCAG AA.
                    </>
                  ) : (
                    <>
                      <LuAlertTriangle />
                      {audit.failures.length} pairing{audit.failures.length === 1 ? "" : "s"} below
                      AA: {audit.failures.map((f) => f.label).join(", ")}.
                    </>
                  )}
                </div>
              </div>
            )}

            <button className="import-apply-btn" onClick={apply} disabled={!result?.ok}>
              Preview this theme
            </button>
          </div>
        </div>
      )}
    </>
  );
};
