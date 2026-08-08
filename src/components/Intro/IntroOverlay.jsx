import "./IntroOverlay.css";
import { useCallback, useEffect, useState } from "react";
import { LuPalette, LuMonitorSmartphone, LuShieldCheck, LuX } from "react-icons/lu";
import { useModal } from "../Modal/useModal";
import { onOpenGuide } from "./guide";

const SEEN_KEY = "theme-lab:intro-seen";

// Kept to one short sentence each so the titles stay on one line and the three
// cards are the same height. The old copy ran long and left the first two cards
// half empty while the third wrapped.
const STEPS = [
  {
    icon: LuPalette,
    title: "1 · Start a palette",
    body: "Pick a preset and tweak it, or paste tokens an AI already gave you.",
  },
  {
    icon: LuMonitorSmartphone,
    title: "2 · See it on real UI",
    body: "A landing page, sign-in screen and dashboard, re-skinned as you type.",
  },
  {
    icon: LuShieldCheck,
    title: "3 · Check, then ship",
    body: "Every pairing graded against WCAG. Export CSS, Tailwind, JSON or a prompt.",
  },
];

export const IntroOverlay = () => {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* storage unavailable — showing the guide again is harmless */
    }
  }, []);

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

  // Scroll lock, Escape, focus trap and focus restore.
  const dialogRef = useModal(open, close);

  if (!open) return null;

  return (
    <div className="intro-overlay" onClick={close}>
      <div
        className="intro-card"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="intro-close" onClick={close} aria-label="Close">
          <LuX />
        </button>

        <p className="intro-eyebrow">Welcome to Theme Lab</p>
        <h2 id="intro-title" className="intro-heading">
          Design a theme, or check the one your AI just wrote.
        </h2>
        <p className="intro-sub">
          Colour looks fine on a swatch grid and falls apart on a real page. This is where you
          find out which — before you ship it.
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
