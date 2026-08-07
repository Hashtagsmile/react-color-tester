import "./PresetGrid.css";
import { predefinedThemes } from "../../../data/predefinedThemes";
import { COLOR_KEYS } from "../../../utilities/theme";
import { useTheme } from "../../../contexts/useTheme";

export const PresetGrid = () => {
  const { applyPredefined, themeName, isCustom, isDarkMode } = useTheme();

  return (
    <div className="preset-strip" role="listbox" aria-label="Theme presets">
      {predefinedThemes.map((theme) => {
        const variant = theme[isDarkMode ? "dark" : "light"];
        const active = !isCustom && themeName === theme.name;
        return (
          <button
            key={theme.name}
            role="option"
            aria-selected={active}
            className={`preset-tile ${active ? "active" : ""}`}
            onClick={() => applyPredefined(theme.name)}
            title={theme.name}
          >
            <span className="preset-swatches">
              {COLOR_KEYS.map((k) => (
                <span key={k} className="preset-swatch" style={{ background: variant[k] }} />
              ))}
            </span>
            <span className="preset-name">{theme.name}</span>
          </button>
        );
      })}
    </div>
  );
};
