import { MdUndo, MdRedo, MdDarkMode, MdLightMode } from "react-icons/md";
import { RxReset } from "react-icons/rx";
import { useTheme } from "../../../contexts/useTheme";
import "./ActionControls.css";

export const ActionControls = () => {
  const {
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    editCount,
    isDarkMode,
    toggleDarkMode,
  } = useTheme();

  return (
    <div className="action-controls">
      <div className="action-group">
        <button onClick={undo} disabled={!canUndo} title="Undo" aria-label="Undo">
          <MdUndo />
        </button>
        <button onClick={redo} disabled={!canRedo} title="Redo" aria-label="Redo">
          <MdRedo />
        </button>
        <button
          onClick={reset}
          disabled={!canUndo && !canRedo}
          title="Reset to preset"
          aria-label="Reset"
        >
          <RxReset />
        </button>
        <span className="edit-count" title="Changes on the undo stack">
          {editCount} {editCount === 1 ? "edit" : "edits"}
        </span>
      </div>

      <button
        className="mode-toggle"
        onClick={toggleDarkMode}
        aria-pressed={isDarkMode}
        title="Toggle preview light / dark"
      >
        {isDarkMode ? <MdDarkMode /> : <MdLightMode />}
        <span>{isDarkMode ? "Dark" : "Light"}</span>
      </button>
    </div>
  );
};
