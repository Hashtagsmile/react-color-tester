import React, { useState, useEffect } from "react";
import { isColorLight, getCSSVariableValue } from "../utilities/utilities";
import "./ThemeNavbar.css";

const ThemeNavBar = () => {
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
  const [secondaryColor, setSecondaryColor] = useState(
    getCSSVariableValue("--color-secondary")
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
    document.documentElement.style.setProperty(
      "--color-secondary",
      secondaryColor
    );
    document.documentElement.style.setProperty("--font-family", font);
  }, [
    primaryColor,
    backgroundColor,
    textColor,
    accentColor,
    secondaryColor,
    font,
  ]);

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

    // Dispatch the custom event to notify other components
    const colorChangeEvent = new Event("colorChange");
    window.dispatchEvent(colorChangeEvent); // Trigger event globally

    switch (activeColorType) {
      case "primaryColor":
        setPrimaryColor(newColor);
        break;
      case "backgroundColor":
        setBackgroundColor(newColor);
        break;
      case "textColor":
        setTextColor(newColor);
        break;
      case "secondaryColor":
        setSecondaryColor(newColor);
        break;
      case "accentColor":
        setAccentColor(newColor);
        break;
      default:
        break;
    }
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
            color: isColorLight(textColor) ? "#000" : "#fff", // Adjust text color based on background
          }}
          onClick={() => openColorPicker("textColor")}
        >
          Text
        </button>
        <button
          className="color-btn"
          style={{
            backgroundColor: backgroundColor,
            color: isColorLight(backgroundColor) ? "#000" : "#fff",
          }}
          onClick={() => openColorPicker("backgroundColor")}
        >
          Background
        </button>
        <button
          className="color-btn"
          style={{
            backgroundColor: primaryColor,
            color: isColorLight(primaryColor) ? "#000" : "#fff",
          }}
          onClick={() => openColorPicker("primaryColor")}
        >
          Primary
        </button>
        <button
          className="color-btn"
          style={{
            backgroundColor: secondaryColor,
            color: isColorLight(secondaryColor) ? "#000" : "#fff",
          }}
          onClick={() => openColorPicker("secondaryColor")}
        >
          Secondary
        </button>
        <button
          className="color-btn"
          style={{
            backgroundColor: accentColor,
            color: isColorLight(accentColor) ? "#000" : "#fff",
          }}
          onClick={() => openColorPicker("accentColor")}
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
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Lato">Lato</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Oswald">Oswald</option>
            <option value="Poppins">Poppins</option>
            <option value="Merriweather">Merriweather</option>
            <option value="Lobster">Lobster</option>
            <option value="Raleway">Raleway</option>
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
            <button onClick={closeModal} className="close-btn">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeNavBar;
