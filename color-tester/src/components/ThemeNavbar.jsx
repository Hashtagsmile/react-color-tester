import React, { useState, useEffect } from "react";
import {isColorLight, rgbaToHex} from "../utilities/utilities";
import "./ThemeNavbar.css";

const ThemeNavBar = () => {
  // Function to get CSS variable values
  const getCSSVariableValue = (variable) => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim();
    return rgbaToHex(value); // Convert to hex if needed
  };

  const [primaryColor, setPrimaryColor] = useState(
    getCSSVariableValue("--color-primary")
  );
  const [backgroundColor, setBackgroundColor] = useState(
    getCSSVariableValue("--color-background")
  );
  const [textColor, setTextColor] = useState(
    getCSSVariableValue("--color-text")
  );
  const [accentColor, setAccentColor] = useState(
    getCSSVariableValue("--color-accent")
  );

  // Font state
  const [font, setFont] = useState("Arial"); // Default font

  // Modal control state
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [activeColorType, setActiveColorType] = useState("");

  // Update CSS variables whenever colors change
  useEffect(() => {
    document.documentElement.style.setProperty("--color-primary", primaryColor);
    document.documentElement.style.setProperty(
      "--color-background",
      backgroundColor
    );
    document.documentElement.style.setProperty("--color-text", textColor);
    document.documentElement.style.setProperty("--color-accent", accentColor);
    document.documentElement.style.setProperty("--font-family", font);
  }, [primaryColor, backgroundColor, textColor, accentColor, font]);

  const openColorPicker = (colorType) => {
    setActiveColorType(colorType);
    setModalOpen(true);
    setSelectedColor(eval(colorType)); // Assign the current color value
  };

  // Function to handle font change
  const handleFontChange = (e) => {
    setFont(e.target.value);
  };

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setSelectedColor(newColor);

    if (activeColorType === "primaryColor") setPrimaryColor(newColor);
    if (activeColorType === "backgroundColor") setBackgroundColor(newColor);
    if (activeColorType === "textColor") setTextColor(newColor);
    if (activeColorType === "accentColor") setAccentColor(newColor);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveColorType("");
  };

  return (
    <div className="theme-navbar">
      <div className="color-buttons">
        <button
          className="color-btn"
          style={{
            backgroundColor: textColor,
            color: isColorLight(textColor) ? "#000" : "#fff" // Adjust text color based on background
          }}
          onClick={() => openColorPicker('textColor')}
        >
          Text
        </button>
        <button
          className="color-btn"
          style={{
            backgroundColor: backgroundColor,
            color: isColorLight(backgroundColor) ? "#000" : "#fff"
          }}
          onClick={() => openColorPicker('backgroundColor')}
        >
          Background
        </button>
        <button
          className="color-btn"
          style={{
            backgroundColor: primaryColor,
            color: isColorLight(primaryColor) ? "#000" : "#fff"
          }}
          onClick={() => openColorPicker('primaryColor')}
        >
          Primary
        </button>
        <button
          className="color-btn"
          style={{
            backgroundColor: accentColor,
            color: isColorLight(accentColor) ? "#000" : "#fff"
          }}
          onClick={() => openColorPicker('accentColor')}
        >
          Accent
        </button>
        <div className="font-picker-wrapper">
          <select value={font} onChange={handleFontChange}>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
          </select>
        </div>
      </div>

      {isModalOpen && (
        <div className="color-modal">
          <div className="modal-content">
            <input
              type="color"
              value={selectedColor}
              onChange={handleColorChange}
            />
            <button onClick={closeModal} className="close-btn">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeNavBar;
