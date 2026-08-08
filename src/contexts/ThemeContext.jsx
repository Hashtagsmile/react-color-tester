import { createContext, useEffect, useReducer } from "react";
import { predefinedFonts, predefinedThemes } from "../data/predefinedThemes";
import {
  COLOR_KEYS,
  decodeTheme,
  encodeTheme,
  generateVariant,
  makeAccessible,
  randomColors,
  randomFonts,
  readableTextColor,
} from "../lib";

export const ThemeContext = createContext(null);

const STORAGE_KEY = "theme-lab:v2";
const HISTORY_LIMIT = 50;
const DEFAULT_THEME = predefinedThemes[0];

const defaultLocks = COLOR_KEYS.reduce((acc, k) => ({ ...acc, [k]: false }), {});

/* ------------------------------------------------------------------ */
/*  Reducer                                                            */
/* ------------------------------------------------------------------ */

// The slice of state that undo/redo restores.
const snapshot = (s) => ({
  colors: s.colors,
  fonts: s.fonts,
  themeName: s.themeName,
  isCustom: s.isCustom,
  locked: s.locked,
});

// Apply `changes` while recording the pre-change state onto the undo stack.
const withHistory = (state, changes) => ({
  ...state,
  ...changes,
  past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
  future: [],
  checkpoint: null,
});

const reducer = (state, action) => {
  switch (action.type) {
    case "APPLY_PREDEFINED": {
      const theme = predefinedThemes.find((t) => t.name === action.name);
      if (!theme) return state;
      return withHistory(state, {
        colors: theme[state.isDarkMode ? "dark" : "light"],
        fonts: { header: theme.headerFont, body: theme.bodyFont },
        themeName: theme.name,
        isCustom: false,
      });
    }

    // Live drag: update the swatch without spamming the undo stack, but stash a
    // one-time checkpoint of where we started so the eventual commit is undoable.
    case "PREVIEW_COLOR":
      return {
        ...state,
        colors: { ...state.colors, [action.key]: action.value },
        isCustom: true,
        themeName: "Custom",
        checkpoint: state.checkpoint ?? snapshot(state),
      };

    // Pointer released / picker closed: fold the whole gesture into one history entry.
    case "COMMIT_COLOR": {
      const checkpoint = state.checkpoint ?? snapshot(state);
      return {
        ...state,
        colors: { ...state.colors, [action.key]: action.value },
        isCustom: true,
        themeName: "Custom",
        past: [...state.past, checkpoint].slice(-HISTORY_LIMIT),
        future: [],
        checkpoint: null,
      };
    }

    case "SET_FONT":
      return withHistory(state, {
        fonts: { ...state.fonts, [action.slot]: action.value },
      });

    // Randomize is a "give me a starting point" action, so the starting point
    // shouldn't be one that fails WCAG. Locked swatches are left alone, which
    // means a heavily locked palette can still come back failing — the sidebar
    // says so, and offers the fix.
    case "RANDOMIZE_COLORS":
      return withHistory(state, {
        colors: makeAccessible(
          randomColors(state.locked, state.colors, state.isDarkMode),
          state.locked,
        ),
        isCustom: true,
        themeName: "Custom",
      });

    case "RANDOMIZE_FONTS":
      return withHistory(state, { fonts: randomFonts(predefinedFonts) });

    // Locks are a meta-setting, not a theme value — deliberately not on the undo stack.
    case "TOGGLE_LOCK":
      return {
        ...state,
        locked: { ...state.locked, [action.key]: !state.locked[action.key] },
      };

    case "TOGGLE_DARK": {
      const isDarkMode = !state.isDarkMode;
      let colors;
      if (state.isCustom) {
        colors = generateVariant(state.colors, isDarkMode);
      } else {
        const theme = predefinedThemes.find((t) => t.name === state.themeName);
        colors = theme ? theme[isDarkMode ? "dark" : "light"] : state.colors;
      }
      return { ...state, isDarkMode, colors };
    }

    case "UNDO": {
      if (!state.past.length) return state;
      const previous = state.past[state.past.length - 1];
      return {
        ...state,
        ...previous,
        past: state.past.slice(0, -1),
        future: [snapshot(state), ...state.future].slice(0, HISTORY_LIMIT),
        checkpoint: null,
      };
    }

    case "REDO": {
      if (!state.future.length) return state;
      const next = state.future[0];
      return {
        ...state,
        ...next,
        past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        checkpoint: null,
      };
    }

    // Applying a single suggested contrast fix. Undoable, so trying one is safe.
    case "SET_COLOR":
      return withHistory(state, {
        colors: { ...state.colors, [action.key]: action.value },
        isCustom: true,
        themeName: "Custom",
      });

    // Everything the audit flags, fixed at once.
    case "FIX_CONTRAST": {
      const fixed = makeAccessible(state.colors, state.locked);
      if (COLOR_KEYS.every((k) => fixed[k] === state.colors[k])) return state;
      return withHistory(state, { colors: fixed, isCustom: true, themeName: "Custom" });
    }

    // Tokens pasted in from outside (an AI assistant, an existing codebase).
    // Undoable like any other edit, so it's safe to try one and step back.
    case "IMPORT_THEME":
      return withHistory(state, {
        colors: action.colors,
        fonts: action.fonts ?? state.fonts,
        themeName: "Imported",
        isCustom: true,
      });

    case "RESET":
      return {
        ...state,
        colors: DEFAULT_THEME[state.isDarkMode ? "dark" : "light"],
        fonts: { header: DEFAULT_THEME.headerFont, body: DEFAULT_THEME.bodyFont },
        themeName: DEFAULT_THEME.name,
        isCustom: false,
        locked: defaultLocks,
        past: [],
        future: [],
        checkpoint: null,
      };

    default:
      return state;
  }
};

/* ------------------------------------------------------------------ */
/*  Initial state — URL share > localStorage > system preference      */
/* ------------------------------------------------------------------ */

const buildInitialState = () => {
  const base = {
    colors: DEFAULT_THEME.light,
    fonts: { header: DEFAULT_THEME.headerFont, body: DEFAULT_THEME.bodyFont },
    themeName: DEFAULT_THEME.name,
    isCustom: false,
    isDarkMode: false,
    locked: defaultLocks,
    past: [],
    future: [],
    checkpoint: null,
  };

  // 1. A shared theme in the URL wins so links reproduce exactly.
  const shared = new URLSearchParams(window.location.search).get("theme");
  if (shared) {
    const decoded = decodeTheme(shared);
    if (decoded) {
      return {
        ...base,
        colors: decoded.colors,
        fonts: decoded.fonts,
        isDarkMode: decoded.isDarkMode,
        themeName: "Custom",
        isCustom: true,
      };
    }
  }

  // 2. Restore the user's last session.
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.colors && saved?.fonts) {
      return { ...base, ...saved, past: [], future: [], checkpoint: null };
    }
  } catch {
    /* ignore corrupt storage */
  }

  // 3. First visit — honour the OS light/dark preference.
  const prefersDark =
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  return {
    ...base,
    isDarkMode: prefersDark,
    colors: DEFAULT_THEME[prefersDark ? "dark" : "light"],
  };
};

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);
  const { colors, fonts, isDarkMode } = state;

  // Push colors + fonts to CSS custom properties whenever they change.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", colors.primary);
    root.style.setProperty("--color-secondary", colors.secondary);
    root.style.setProperty("--color-accent", colors.accent);
    root.style.setProperty("--color-background", colors.background);
    root.style.setProperty("--color-text", colors.text);

    // Foregrounds for anything painted ON a brand color. Surfaces used to just
    // reuse --color-background here, which silently fails whenever background
    // and primary are both light (or both dark).
    root.style.setProperty("--on-primary", readableTextColor(colors.primary));
    root.style.setProperty("--on-accent", readableTextColor(colors.accent));

    root.style.setProperty("--header-font-family", `"${fonts.header}", system-ui, sans-serif`);
    root.style.setProperty("--body-font-family", `"${fonts.body}", system-ui, sans-serif`);
    root.setAttribute("data-theme", isDarkMode ? "dark" : "light");
  }, [colors, fonts, isDarkMode]);

  // Persist the editable state (never the history) for the next session.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          colors: state.colors,
          fonts: state.fonts,
          themeName: state.themeName,
          isCustom: state.isCustom,
          isDarkMode: state.isDarkMode,
          locked: state.locked,
        })
      );
    } catch {
      /* storage full / unavailable — non-fatal */
    }
  }, [state.colors, state.fonts, state.themeName, state.isCustom, state.isDarkMode, state.locked]);

  const value = {
    // state
    colors,
    fonts,
    themeName: state.themeName,
    isCustom: state.isCustom,
    isDarkMode,
    locked: state.locked,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    editCount: state.past.length,

    // convenience flatteners (kept so simple consumers stay readable)
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    accentColor: colors.accent,
    backgroundColor: colors.background,
    textColor: colors.text,
    headerFont: fonts.header,
    bodyFont: fonts.body,

    // actions
    applyPredefined: (name) => dispatch({ type: "APPLY_PREDEFINED", name }),
    previewColor: (key, value) => dispatch({ type: "PREVIEW_COLOR", key, value }),
    commitColor: (key, value) => dispatch({ type: "COMMIT_COLOR", key, value }),
    setFont: (slot, value) => dispatch({ type: "SET_FONT", slot, value }),
    randomizeColors: () => dispatch({ type: "RANDOMIZE_COLORS" }),
    randomizeFonts: () => dispatch({ type: "RANDOMIZE_FONTS" }),
    toggleLock: (key) => dispatch({ type: "TOGGLE_LOCK", key }),
    toggleDarkMode: () => dispatch({ type: "TOGGLE_DARK" }),
    undo: () => dispatch({ type: "UNDO" }),
    redo: () => dispatch({ type: "REDO" }),
    reset: () => dispatch({ type: "RESET" }),
    setColor: (key, value) => dispatch({ type: "SET_COLOR", key, value }),
    fixContrast: () => dispatch({ type: "FIX_CONTRAST" }),
    importTheme: (importedColors, importedFonts) =>
      dispatch({ type: "IMPORT_THEME", colors: importedColors, fonts: importedFonts }),

    // shareable deep link
    shareUrl: () => {
      const { origin, pathname } = window.location;
      return `${origin}${pathname}?theme=${encodeTheme(colors, fonts, isDarkMode)}`;
    },
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
