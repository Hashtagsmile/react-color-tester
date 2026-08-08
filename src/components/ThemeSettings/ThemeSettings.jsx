import "./ThemeSettings.css";
import { useState } from "react";
import { FaDice } from "react-icons/fa";
import { LuPanelRightClose, LuPanelRightOpen } from "react-icons/lu";
import DropdownButton from "../DropdownButton/DropdownButton";
import { predefinedFonts } from "../../data/predefinedThemes";
import { useTheme } from "../../contexts/useTheme";
import { ColorPicker } from "./ColorPicker/ColorPicker";
import { ExportModal } from "./ExportModal/ExportModal";
import { ImportModal } from "./ImportModal/ImportModal";
import { ActionControls } from "./ActionControls/ActionControls";
import { ContrastPanel } from "./ContrastPanel/ContrastPanel";
import { PresetGrid } from "./PresetGrid/PresetGrid";

const COLOR_FIELDS = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
  { key: "text", label: "Text" },
];

const TABS = ["Colors", "Fonts", "Contrast"];

export const ThemeSettings = () => {
  const {
    colors,
    fonts,
    themeName,
    isCustom,
    setFont,
    randomizeColors,
    randomizeFonts,
  } = useTheme();

  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Colors");

  return (
    <aside id="theme-editor" className={`settings-root ${open ? "open" : "collapsed"}`}>
      <button
        className="settings-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Collapse editor" : "Open editor"}
      >
        {open ? <LuPanelRightClose /> : <LuPanelRightOpen />}
      </button>

      <div className="settings-panel">
        <div className="settings-scroll">
          <div className="settings-head">
            <h2>Theme editor</h2>
            <span className="settings-current">
              {isCustom ? "Custom theme" : themeName}
            </span>
          </div>

          <div className="settings-block">
            <label className="block-label">Start from a preset</label>
            <PresetGrid />
          </div>

          <ActionControls />

          <div className="settings-tabs" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                className={`settings-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Colors" && (
            <div className="settings-tabpanel">
              <div className="panel-actionrow">
                <span className="panel-hint">Lock a swatch to keep it while you randomize</span>
                <button className="ghost-btn" onClick={randomizeColors}>
                  <FaDice /> Randomize
                </button>
              </div>
              <div className="color-list">
                {COLOR_FIELDS.map((field) => (
                  <ColorPicker
                    key={field.key}
                    colorKey={field.key}
                    label={field.label}
                    color={colors[field.key]}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === "Fonts" && (
            <div className="settings-tabpanel">
              <div className="panel-actionrow">
                <span className="panel-hint">Heading &amp; body typefaces</span>
                <button className="ghost-btn" onClick={randomizeFonts}>
                  <FaDice /> Randomize
                </button>
              </div>

              <div className="font-field">
                <label className="block-label">Heading font</label>
                <DropdownButton
                  options={predefinedFonts}
                  onSelect={(f) => setFont("header", f)}
                  selectedOption={fonts.header}
                  buttonTitle="Select font"
                />
                <p className="font-preview" style={{ fontFamily: `"${fonts.header}", sans-serif` }}>
                  The quick brown fox
                </p>
              </div>

              <div className="font-field">
                <label className="block-label">Body font</label>
                <DropdownButton
                  options={predefinedFonts}
                  onSelect={(f) => setFont("body", f)}
                  selectedOption={fonts.body}
                  buttonTitle="Select font"
                />
                <p className="font-preview body" style={{ fontFamily: `"${fonts.body}", sans-serif` }}>
                  Jumps over the lazy dog, then packs a dozen crates.
                </p>
              </div>
            </div>
          )}

          {activeTab === "Contrast" && (
            <div className="settings-tabpanel">
              <ContrastPanel />
            </div>
          )}
        </div>

        <div className="settings-footer">
          <ImportModal />
          <ExportModal />
        </div>
      </div>
    </aside>
  );
};
