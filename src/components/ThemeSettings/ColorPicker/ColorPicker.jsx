import { useState } from "react";
import { CiLock, CiUnlock } from "react-icons/ci";
import { LuCopy, LuCheck } from "react-icons/lu";
import { useTheme } from "../../../contexts/useTheme";
import "./ColorPicker.css";

export const ColorPicker = ({ colorKey, label, color }) => {
  const { previewColor, commitColor, toggleLock, locked } = useTheme();
  const [copied, setCopied] = useState(false);

  const isLocked = locked[colorKey];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(color);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={`color-picker ${isLocked ? "locked" : ""}`}>
      <div className="color-swatch-wrap">
        <input
          type="color"
          value={color}
          aria-label={`${label} color`}
          className="color-input"
          onInput={(e) => previewColor(colorKey, e.target.value)}
          onChange={(e) => commitColor(colorKey, e.target.value)}
        />
      </div>

      <div className="color-meta">
        <span className="color-label">{label}</span>
        <span className="color-hex">{color.toUpperCase()}</span>
      </div>

      <div className="color-actions">
        <button
          type="button"
          className={`swatch-btn ${isLocked ? "on" : ""}`}
          onClick={() => toggleLock(colorKey)}
          aria-pressed={isLocked}
          aria-label={isLocked ? `Unlock ${label}` : `Lock ${label}`}
          title={isLocked ? "Locked — won't change on randomize" : "Lock this color"}
        >
          {isLocked ? <CiLock /> : <CiUnlock />}
        </button>
        <button
          type="button"
          className="swatch-btn"
          onClick={handleCopy}
          aria-label={`Copy ${label} hex`}
          title="Copy hex"
        >
          {copied ? <LuCheck className="copied-tick" /> : <LuCopy />}
        </button>
      </div>
    </div>
  );
};
