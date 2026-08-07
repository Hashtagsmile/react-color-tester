import "./TopBar.css";
import { useState } from "react";
import { FiGithub, FiHelpCircle } from "react-icons/fi";
import { LuLink, LuCheck } from "react-icons/lu";
import { useTheme } from "../../contexts/useTheme";
import logo from "../../assets/logomark.svg";
import { openGuide } from "../Intro/guide";

const REPO_URL = "https://github.com/Hashtagsmile/react-color-tester";

export const TopBar = () => {
  const { shareUrl } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <img src={logo} className="topbar-logo" alt="" />
        <div className="topbar-brand-text">
          <span className="topbar-name">Theme&nbsp;Lab</span>
          <span className="topbar-tag">
            Design a theme, preview it on real UI, and export CSS — or an AI‑ready prompt.
          </span>
        </div>
      </div>

      <div className="topbar-actions">
        <button className="topbar-btn" onClick={() => openGuide()}>
          <FiHelpCircle /> <span className="topbar-btn-label">How it works</span>
        </button>
        <button className="topbar-btn primary" onClick={handleShare}>
          {copied ? <LuCheck /> : <LuLink />}
          <span className="topbar-btn-label">{copied ? "Link copied" : "Share"}</span>
        </button>
        <a
          className="topbar-btn icon-only"
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="View source on GitHub"
        >
          <FiGithub />
        </a>
      </div>
    </header>
  );
};
