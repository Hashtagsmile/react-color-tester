import { useContext } from "react";
import { ThemeContext } from "./ThemeContext";

/**
 * Read the live theme state (colors, fonts, locks, history) and its dispatchers.
 * Kept in its own module so ThemeContext.jsx only exports components — otherwise
 * Vite's fast refresh drops the provider's state on every edit.
 */
export const useTheme = () => useContext(ThemeContext);
