import { useContext, useState } from "react";
import { ThemeContext } from "../../../contexts/ThemeContext";
import { CiUnlock, CiLock } from "react-icons/ci";
import { LuCopy } from "react-icons/lu";
import "./ColorPicker.css";

export const ColorPicker = ({ colorType, label, color }) => {
  const {
    handleColorChangeFinal,
    toggleLockColor,
    lockedColors,
    handleColorDrag,
  } = useContext(ThemeContext);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const handleColorChange = (e) => {
    handleColorDrag(colorType, e.target.value);
    setIsColorPickerOpen(false); // Close after the change
  };

  // Handle mouse up only if the color picker was opened
  const handleMouseUp = (e) => {
    if (isColorPickerOpen) {
      handleColorChangeFinal(colorType, e.target.value);
      setIsColorPickerOpen(false); // Reset the state after handling
    }
  };

  const handleCopyColor = (color) => {
    try {
      navigator.clipboard.writeText(color);
      console.log("Color copied: ", color);
    } catch (error) {
      console.error("Could not copy color: ", error);
    }
  };

  return (
    <div className="color-picker">
      <label className="color-label">{label}</label>
      <div className="color-actions">
        <div className="colpic-container">
          <div className="colpic-wrapper">
            <input
              type="color"
              value={color}
              onClick={() => {
                setIsColorPickerOpen(true);
              }}
              onChange={(e) => handleColorChange(e)}
              onMouseUp={(e) => handleMouseUp(e)}
              className="color-picker"
            />
          </div>
          <div className="hex-color"> {color} </div>
        </div>

        <div className="copy-lock-container">
          <button
            className="action-button"
            onClick={() => toggleLockColor(colorType)}
          >
            {lockedColors[colorType] ? <CiUnlock /> : <CiLock />}
          </button>
          <button
            className="action-button"
            onClick={() => handleCopyColor(color)}
          >
            <LuCopy />
          </button>
        </div>
      </div>
    </div>
  );
};
