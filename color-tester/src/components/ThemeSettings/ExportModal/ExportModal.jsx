import { useContext, useState } from "react";
import { ThemeContext } from "../../../contexts/ThemeContext";
import chroma from "chroma-js";
import "./ExportModal.css";

export const ExportModal = () => {
  const { primaryColor, secondaryColor, accentColor, backgroundColor, textColor } = useContext(ThemeContext);

  const [isModalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("current");
  const [activeFormat, setActiveFormat] = useState("HEX");

  const convertColor = (color) => {
    switch (activeFormat) {
      case "RGB":
        return chroma(color).css("rgb");
      case "HSL":
        return chroma(color).css("hsl");
      default:
        return color; // HEX by default
    }
  };

  // CSS for current theme mode (either dark or light mode)
  const currentThemeExport = `
    --primary-color: ${convertColor(primaryColor)};
    --secondary-color: ${convertColor(secondaryColor)};
    --accent-color: ${convertColor(accentColor)};
    --background-color: ${convertColor(backgroundColor)};
    --text-color: ${convertColor(textColor)};
  `;

  // CSS for both light and dark themes
  const fullThemeExport = `
:root[data-theme="light"] {
  --primary-color: ${convertColor(primaryColor)};
  --secondary-color: ${convertColor(secondaryColor)};
  --accent-color: ${convertColor(accentColor)};
  --background-color: ${convertColor(backgroundColor)};
  --text-color: ${convertColor(textColor)};
}

:root[data-theme="dark"] {
  --primary-color: ${convertColor(primaryColor)};
  --secondary-color: ${convertColor(secondaryColor)};
  --accent-color: ${convertColor(accentColor)};
  --background-color: ${convertColor(backgroundColor)};
  --text-color: ${convertColor(textColor)};
}
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(colorScheme);
    alert("Copied to clipboard");
  };

  return (
    <>
      <button className="export-theme-button" onClick={() => setModalOpen(true)}>
        Export Theme
      </button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Export Theme</h3>

            {/* Tab navigation */}
            <div className="tab-navigation">
              <button
                className={activeTab === "current" ? "active-tab" : ""}
                onClick={() => setActiveTab("current")}
              >
                Current Theme
              </button>
              <button
                className={activeTab === "both" ? "active-tab" : ""}
                onClick={() => setActiveTab("both")}
              >
                Both Light & Dark
              </button>
            </div>

            {/* Format conversion chips */}
            <div className="conversion-chips">
              <button
                className={activeFormat === "HEX" ? "active-chip" : ""}
                onClick={() => setActiveFormat("HEX")}
              >
                HEX
              </button>
              <button
                className={activeFormat === "RGB" ? "active-chip" : ""}
                onClick={() => setActiveFormat("RGB")}
              >
                RGB
              </button>
            </div>

            {/* Tab content */}
            <div className="tab-content">
              {activeTab === "current" && <pre>{currentThemeExport}</pre>}
              {activeTab === "both" && <pre>{fullThemeExport}</pre>}
            </div>

            {/* Buttons */}
            <div className="modal-buttons">
              <button
                onClick={() =>
                  copyToClipboard(
                    activeTab === "current" ? currentThemeExport : fullThemeExport
                  )
                }
              >
                Copy to Clipboard
              </button>
              <button onClick={() => setModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
