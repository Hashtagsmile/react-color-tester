import { useContext } from "react";
import { ThemeContext } from "../../../contexts/ThemeContext";
import { MdUndo, MdRedo, MdDarkMode, MdLightMode } from "react-icons/md";
import { RxReset } from "react-icons/rx";
import "./ActionControls.css";

export const ActionControls = () => {
  const {
    undoTheme,
    redoTheme,
    resetTheme,
    themeHistory,
    redoStack,
    isDarkMode,
    toggleDarkMode,
  } = useContext(ThemeContext);

  return (
    <div className="action-controls">
      <div className="action-top-container">
        <div className="undo-redo-container">
          <button
            onClick={undoTheme}
            disabled={themeHistory.length === 0}
            className={themeHistory.length === 0 ? "disabled" : ""}
          >
            <MdUndo className="action-icon" />
          </button>
          <button
            onClick={redoTheme}
            disabled={redoStack.length === 0}
            className={redoStack.length === 0 ? "disabled" : ""}
          >
            <MdRedo className="action-icon" />
          </button>
        </div>
        <div className="reset-container">
          <button
            onClick={resetTheme}
            disabled={themeHistory.length === 0 && redoStack.length === 0}
            className={
              themeHistory.length === 0 && redoStack.length === 0
                ? "redo-button-disabled"
                : "redo-button"
            }
          >
            <RxReset className="action-icon" />
          </button>
        </div>
      </div>
      <div className="mode-contaner">
        <div className="mode">
          <span className="highlight">Current mode:</span>
          <div>{isDarkMode ? <div>Dark mode</div> : <div>Light mode</div>}</div>
        </div>
        <button className="toggle-mode" onClick={toggleDarkMode}>
          {isDarkMode ? <MdDarkMode /> : <MdLightMode />}
        </button>
      </div>
      <div className="edit-container">
        <span className="highlight">Edits done:</span>
        <div>{themeHistory.length}</div>
      </div>
    </div>
  );
};
