import "./ThemeSettings.css";
import { useState, useContext } from "react";
import { GoSidebarExpand } from "react-icons/go";
import { GoSidebarCollapse } from "react-icons/go";
import DropdownButton from "../DropdownButton/DropdownButton";
import { predefinedThemes, predefinedFonts } from "../../data/predefinedThemes";
import { ThemeContext } from "../../contexts/ThemeContext";
import { ColorPicker } from "./ColorPicker/ColorPicker";
import { FaDice } from "react-icons/fa";
import { ExportModal } from "./ExportModal/ExportModal";
import { ActionControls } from "./ActionControls/ActionControls";
import { default as ThirdPartyColorPicker, themes } from 'react-pick-color';

export const ThemeSettings = () => {
  const {
    primaryColor,
    backgroundColor,
    textColor,
    accentColor,
    secondaryColor,
    applyTheme,
    currentTheme,
    setHeaderFont,
    setBodyFont,
    bodyFont,
    headerFont,
    randomizeColors,
    randomizeFont,
  } = useContext(ThemeContext); // Consuming the ThemeContext

  console.log(currentTheme.isCustom)
  // Sidebar and tab control states
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState("Colors");

  const toggleSettings = () => {
    if (settingsOpen) {
      setIsClosing(true);
      setTimeout(() => {
        setSettingsOpen(false);
        setIsClosing(false);
      }, 100);
    } else {
      setSettingsOpen(true);
    }
  };

  const isCustomTheme = (currentTheme) => {
    if (currentTheme.isCustom) {
        return "Custom theme";
    }
    return currentTheme.name;
};

  return (
    <section>
      <button className={`open-sidebar-btn ${settingsOpen ? 'active' : ''}`} onClick={toggleSettings}>
      <GoSidebarCollapse/>
      </button>

      <div
        className={`settings-container ${settingsOpen ? "open" : ""} ${
          isClosing ? "closing" : ""
        }`}
      >
        <div className="settings-content">
          <div className="sticky-action-container">
            <ActionControls />
          </div>
          <div className="top-content">
            Theme Settings
          </div>
          <div className="dropdown-section">
            <p className="dropdown-label">Select a predefined theme or adjust the colors below to make your own custom theme</p>
            <DropdownButton
              options={predefinedThemes.map((theme) => theme.name)}
              onSelect={(theme) => applyTheme({ name: theme })}
              buttonTitle="Select Theme"
              selectedOption={isCustomTheme(currentTheme)}
            />
          </div>
          {/* Tab Section */}
          <div className="tabs">
            <button
              className={`tab-button ${activeTab === "Colors" ? "active" : ""}`}
              onClick={() => setActiveTab("Colors")}
            >
              Colors
            </button>
            <button
              className={`tab-button ${activeTab === "Fonts" ? "active" : ""}`}
              onClick={() => setActiveTab("Fonts")}
            >
              Fonts
            </button>
            <button
              className={`tab-button ${
                activeTab === "General" ? "active" : ""
              }`}
              onClick={() => setActiveTab("General")}
            >
              General
            </button>
            <div className="underline" style={{ left: activeTab === "Colors" ? "0%" : activeTab === "Fonts" ? "33.33%" : "66.66%" }}></div>
          </div>

          {/* Colors Tab */}
          {activeTab === "Colors" && (
            <div className="tab-content">
              {/* Add color-related settings here, like color pickers */}
              <div className="random-container">
                <div className="random">Randomize Colors</div>
                <button
                  className="button-random"
                  onClick={() => randomizeColors()}
                >
                  <FaDice />
                </button>
              </div>
              <ColorPicker
                colorType="primaryColor"
                label="Primary Color"
                color={primaryColor}
              />
              <ColorPicker
                colorType="secondaryColor"
                label="Secondary Color"
                color={secondaryColor}
              />
              <ColorPicker
                colorType="accentColor"
                label="Accent Color"
                color={accentColor}
              />
              <ColorPicker
                colorType="backgroundColor"
                label="Background Color"
                color={backgroundColor}
              />
              <ColorPicker
                colorType="textColor"
                label="Text Color"
                color={textColor}
              />
            </div>
          )}

          {/* Fonts Tab */}
          {activeTab === "Fonts" && (
            <div className="tab-content">
              {/* Add font-related settings here, like dropdowns for fonts */}
              <p>Select your preferred fonts and font sizes.</p>
              <div className="font-option">
                <p className="font-name">Font Headings</p>{" "}
                <DropdownButton
                  options={predefinedFonts}
                  onSelect={(selectedFont) => setHeaderFont(selectedFont)}
                  selectedOption={headerFont} // Selected font for dropdown
                  buttonTitle="Select Font" // Default text before selection
                />
              </div>

              <div className="font-option">
                <p className="font-name">Font body</p>{" "}
                <DropdownButton
                  options={predefinedFonts}
                  onSelect={(selectedFont) => setBodyFont(selectedFont)}
                  selectedOption={bodyFont} // Selected font for dropdown
                  buttonTitle="Select Font" // Default text before selection
                />
              </div>
              <button onClick={() => randomizeFont()}>Randomize font </button>
              <div className="font-option">
                <p className="font-name">Heading size</p>{" "}
              </div>
              <div className="font-option">
                <p className="font-name">Body size</p>{" "}
              </div>
            </div>
          )}

          {/* General Tab */}
          {activeTab === "General" && (
            <div className="tab-content">
              {/* Add general settings like dark mode toggle or other settings */}
              <p>Configure general settings here, like dark mode or layout.</p>
            </div>
          )}

          {/* Settings footer */}
          <div className="sticky-footer">
            <ExportModal />
          </div>
        </div>
      </div>
    </section>
  );
};
