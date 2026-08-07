import "./IntroOverlay.css";
import { useEffect, useState } from "react";
import { LuPalette, LuMonitorSmartphone, LuDownload, LuX } from "react-icons/lu";
import { onOpenGuide } from "./guide";

const SEEN_KEY = "theme-lab:intro-seen";

const STEPS = [
  {
    icon: LuPalette,
    title: "1 · Pick your palette",
    body: "Set five colors and two fonts in the sidebar — or start from a preset and tweak. Lock the ones you love, then randomize the rest.",
  },
  {
    icon: LuMonitorSmartphone,
    title: "2 · See it on real UI",
    body: "Every change lands instantly on a real landing page, sign-in screen and dashboard. Toggle dark mode and watch the whole thing adapt.",
  },
  {
    icon: LuDownload,
    title: "3 · Export or hand it to AI",
    body: "Copy production-ready CSS, Tailwind or JSON — or an AI-ready prompt you can paste straight into Cursor, Claude Code or Copilot. Or grab a share link that reopens your exact theme.",
  },
];

export const IntroOverlay = () => {
  const [open, setOpen] = useState(false);

  // Show once on first visit; re-openable from the "How it works" button.
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (!seen) setOpen(true);
    return onOpenGuide(() => setOpen(true));
  }, []);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="intro-overlay" role="dialog" aria-modal="true" aria-labelledby="intro-title" onClick={close}>
      <div className="intro-card" onClick={(e) => e.stopPropagation()}>
        <button className="intro-close" onClick={close} aria-label="Close">
          <LuX />
        </button>

        <p className="intro-eyebrow">Welcome to Theme Lab</p>
        <h2 id="intro-title" className="intro-heading">
          Build a color theme, watch it come alive, ship the CSS.
        </h2>
        <p className="intro-sub">
          A live playground for designing accessible color + type themes and exporting them in seconds. No account, nothing to install.
        </p>

        <div className="intro-steps">
          {STEPS.map(({ icon: Icon, title, body }) => (
            <div className="intro-step" key={title}>
              <div className="intro-step-icon">
                <Icon />
              </div>
              <h3 className="intro-step-title">{title}</h3>
              <p className="intro-step-body">{body}</p>
            </div>
          ))}
        </div>

        <button className="intro-cta" onClick={close}>
          Start designing
        </button>
      </div>
    </div>
  );
};
