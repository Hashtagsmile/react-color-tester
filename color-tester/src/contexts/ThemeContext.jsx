import { createContext, useState, useEffect } from "react";
import { getCSSVariableValue } from "../utilities/utilities";
import { predefinedThemes, predefinedFonts } from "../data/predefinedThemes";
import chroma from "chroma-js";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const defaultTheme = predefinedThemes[0];
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);
  const [themeHistory, setThemeHistory] = useState([]); // History for undo
  const [redoStack, setRedoStack] = useState([]); // History for redo
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  // Separate states for header and body fonts
  const [headerFont, setHeaderFont] = useState("Arial");
  const [bodyFont, setBodyFont] = useState("Arial");

  const defaultLockState = {
    primaryColor: false,
    secondaryColor: false,
    accentColor: false,
    backgroundColor: false,
    textColor: false,
  };
  const [lockedColors, setLockedColors] = useState(defaultLockState);

  const toggleLockColor = (colorType) => {
    setLockedColors((prevLocks) => {
      const newLocks = {
        ...prevLocks,
        [colorType]: !prevLocks[colorType], // Toggle the lock state
      };

      // Update theme history with the new lock state
      setThemeHistory((prev) => [
        ...prev,
        {
          primaryColor,
          secondaryColor,
          accentColor,
          backgroundColor,
          textColor,
          headerFont,
          bodyFont,
          lockedColors: newLocks, // Save the new lock state
        },
      ]);

      return newLocks;
    });
  };

  const applyTheme = (theme, mode = isDarkMode) => {
    const selectedTheme = predefinedThemes.find((t) => t.name === theme.name);
    
    console.log("Is theme custom: ", theme.isCustom);
    if (selectedTheme && !theme.isCustom) {
      console.log("It is predefined")
      // For predefined themes
      const themeToApply =
        selectedTheme[mode ? "dark" : "light"] || selectedTheme;

      setCurrentTheme(selectedTheme);
      setPrimaryColor(themeToApply.primaryColor);
      setBackgroundColor(themeToApply.backgroundColor);
      setTextColor(themeToApply.textColor);
      setAccentColor(themeToApply.accentColor);
      setSecondaryColor(themeToApply.secondaryColor);
      setHeaderFont(selectedTheme.headerFont || "Arial"); // Add headerFont
      setBodyFont(selectedTheme.bodyFont || "Arial");
    } else {
      // Custom theme logic
      const customTheme = {
        ...theme,
        name: "Custom Theme",
        isCustom: true, // Mark the theme as custom
        light: generateDarkOrLightCustomTheme(theme, false),
        dark: generateDarkOrLightCustomTheme(theme, true),
      };

      console.log("custom Theme in applyTheme: ", customTheme)

      const themeToApply = mode ? customTheme.dark : customTheme.light;

      setCurrentTheme(customTheme);
      setPrimaryColor(themeToApply.primaryColor);
      setBackgroundColor(themeToApply.backgroundColor);
      setTextColor(themeToApply.textColor);
      setAccentColor(themeToApply.accentColor);
      setSecondaryColor(themeToApply.secondaryColor);
      setHeaderFont(customTheme.headerFont || "Arial");
      setBodyFont(customTheme.bodyFont || "Arial");
    }

    // Update theme history
    setThemeHistory((prev) => [
      ...prev,
      {
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        textColor,
        headerFont,
        bodyFont,
        lockedColors,
      },
    ]);

    setRedoStack([]); // Clear redo stack
  };

  // Function to dynamically generate light/dark mode variants for custom themes
  const generateDarkOrLightCustomTheme = (theme, mode) => {
    // Adjust the background color to be a very light/dark version of the primary color
    const adjustBackgroundFromPrimary = (primaryColor) =>
      mode
        ? chroma(primaryColor).darken(4).desaturate(0.7).hex() // Very dark shade for dark mode
        : chroma(primaryColor).brighten(4).saturate(0.8).hex(); // Very light shade for light mode

    // Set the background color based on the primary color
    const backgroundColor = adjustBackgroundFromPrimary(theme.primaryColor);

    // Function to adjust secondary and accent colors with enhanced contrast check
    const adjustForContrast = (
      color,
      background,
      minContrast = 4.5,
      hueShift = 0
    ) => {
      let adjustedColor = color;

      // Adjust brightness based on mode
      adjustedColor = mode
        ? chroma(adjustedColor).darken(2).desaturate(0.4) // Darken for dark mode
        : chroma(adjustedColor).brighten(2).saturate(0.6); // Brighten for light mode

      // Shift the hue to ensure variation between colors
      adjustedColor = adjustedColor.set("hsl.h", `+${hueShift}`);

      // Adjust the color until it meets the minimum contrast requirement
      while (chroma.contrast(adjustedColor, background) < minContrast) {
        adjustedColor = mode
          ? adjustedColor.brighten(0.5)
          : adjustedColor.darken(0.5);
      }

      return adjustedColor.hex();
    };

    // Primary color remains the same across light and dark modes
    const primaryColor = theme.primaryColor;

    // Adjust secondary and accent colors with contrast check
    const secondaryColor = adjustForContrast(
      theme.secondaryColor,
      backgroundColor,
      4.5,
      20
    ); // Secondary with a hue shift
    const accentColor = adjustForContrast(
      theme.accentColor,
      backgroundColor,
      4.5,
      30
    ); // Accent with a larger hue shift

    // Adjust text color to be a darker/lighter shade of the primary color based on mode
    const textColor = mode
      ? chroma(primaryColor).brighten(3).desaturate(0.4).hex() // Light shade for dark mode
      : chroma(primaryColor).darken(3).desaturate(0.6).hex(); // Dark shade for light mode

    return {
      ...theme,
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      textColor,
    };
  };

  const handleColorDrag = (colorType, newColor) => {
    switch (colorType) {
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

  const handleColorChangeFinal = (colorType, newColor, mode = isDarkMode) => {
    // If modifying a predefined theme, switch to custom mode
    const newTheme = {
      ...currentTheme,
      isCustom: true, // Mark it as a custom theme
      [colorType]: newColor || currentTheme[colorType], // Fallback to the current color if undefined
    };

    console.log("HandleColroChangeFinal")
    console.log("New Theme: ")
    console.log(newTheme)

    // Apply the theme using the centralized applyTheme function
    applyTheme(newTheme, mode);
  };

  const randomizeColors = () => {
    const baseColor = chroma.random();
    const colorScale = chroma.scale([
      baseColor,
      baseColor.set("hsl.h", "+120"),
    ]);

    const newPrimaryColor = lockedColors.primaryColor
      ? primaryColor
      : colorScale(0.3).hex();
    const newSecondaryColor = lockedColors.secondaryColor
      ? secondaryColor
      : colorScale(0.5).hex();
    const newAccentColor = lockedColors.accentColor
      ? accentColor
      : baseColor.set("hsl.h", "+60").hex();

    // Darken or lighten the background, keeping the base color's hue
    const newBackgroundColor = lockedColors.backgroundColor
      ? backgroundColor
      : isDarkMode
      ? chroma(baseColor).darken(1.5).desaturate(0.5).hex() // Darken slightly for dark mode
      : chroma(baseColor).brighten(1.5).saturate(0.5).hex(); // Lighten slightly for light mode

    const newTextColor = lockedColors.textColor
      ? textColor
      : chroma.contrast(newBackgroundColor, "#fff") > 4.5
      ? "#fff"
      : "#333";

    applyTheme({
      primaryColor: newPrimaryColor,
      secondaryColor: newSecondaryColor,
      accentColor: newAccentColor,
      backgroundColor: newBackgroundColor,
      textColor: newTextColor,
      headerFont, // Ensure fonts remain unchanged unless explicitly set
      bodyFont,
    });
  };

  const undoTheme = () => {
    if (themeHistory.length > 0) {
      const lastTheme = themeHistory.pop();
      setThemeHistory([...themeHistory]); // update history after popping latest one

      console.log("lastTheme history: " + JSON.stringify(lastTheme, null, 2));

      setRedoStack((prev) => [
        ...prev,
        {
          primaryColor,
          secondaryColor,
          accentColor,
          backgroundColor,
          textColor,
          headerFont,
          bodyFont,
          lockedColors,
        },
      ]);

      // Restore the previous theme and lock state
      setPrimaryColor(lastTheme.primaryColor);
      setBackgroundColor(lastTheme.backgroundColor);
      setTextColor(lastTheme.textColor);
      setAccentColor(lastTheme.accentColor);
      setSecondaryColor(lastTheme.secondaryColor);
      setBodyFont(lastTheme.bodyFont);
      setHeaderFont(lastTheme.headerFont);
      setLockedColors(lastTheme.lockedColors);
    }
  };

  const redoTheme = () => {
    if (redoStack.length > 0) {
      const lastRedo = redoStack.pop();
      setRedoStack([...redoStack]); // Update the redo stack after removing the last one

      setThemeHistory((prev) => [
        ...prev,
        {
          primaryColor,
          secondaryColor,
          accentColor,
          backgroundColor,
          textColor,
          headerFont,
          bodyFont,
          lockedColors,
        },
      ]);

      setPrimaryColor(lastRedo.primaryColor);
      setBackgroundColor(lastRedo.backgroundColor);
      setTextColor(lastRedo.textColor);
      setAccentColor(lastRedo.accentColor);
      setSecondaryColor(lastRedo.secondaryColor);
      setBodyFont(lastRedo.bodyFont);
      setHeaderFont(lastRedo.headerFont);
      setLockedColors(lastRedo.lockedColors);
    }
  };

  useEffect(() => {
    // Check the user's system preference for dark mode
    const prefersDarkMode =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    console.log("PrefersDarkMode ", prefersDarkMode);

    // Set the initial dark mode state based on the system preference
    setIsDarkMode(prefersDarkMode);

    prefersDarkMode ? document.documentElement.setAttribute("data-theme", "dark") :  document.documentElement.setAttribute("data-theme", "light");

    // Apply the default theme with the correct mode (dark or light)
    applyTheme(defaultTheme, prefersDarkMode);

    // Clear the theme history (if needed)
    setThemeHistory([]);
  }, []);

  useEffect(() => {
    // Update CSS variables whenever theme colors or font change
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
    document.documentElement.style.setProperty(
      "--header-font-family",
      headerFont
    ); // Set header font CSS variable
    document.documentElement.style.setProperty("--body-font-family", bodyFont);
  }, [
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundColor,
    textColor,
    headerFont,
    bodyFont,
  ]);

  const resetTheme = () => {
    setCurrentTheme(defaultTheme);
    applyTheme(defaultTheme);
    setThemeHistory([]);
    setLockedColors(defaultLockState);
    setRedoStack([]);
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => {
      const newMode = !prevMode;

      // Apply the current theme, but with the updated dark mode
      applyTheme(currentTheme, newMode);

      // Set the data-theme attribute based on the new mode
      if (newMode) {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.setAttribute("data-theme", "light");
      }

      return newMode;
    });
  };

  const randomizeFont = () => {
    const randomHeaderFont =
      predefinedFonts[Math.floor(Math.random() * predefinedFonts.length)];
    const randomBodyFont =
      predefinedFonts[Math.floor(Math.random() * predefinedFonts.length)];
    setHeaderFont(randomHeaderFont);
    setBodyFont(randomBodyFont);
  };

  return (
    <ThemeContext.Provider
      value={{
        primaryColor,
        setPrimaryColor,
        backgroundColor,
        setBackgroundColor,
        textColor,
        setTextColor,
        accentColor,
        setAccentColor,
        secondaryColor,
        setSecondaryColor,
        currentTheme,
        applyTheme,
        undoTheme,
        redoTheme,
        resetTheme,
        themeHistory,
        redoStack,
        isDarkMode,
        toggleDarkMode,
        randomizeFont,
        handleColorDrag,
        handleColorChangeFinal,
        randomizeColors,
        lockedColors,
        toggleLockColor,
        setBodyFont,
        bodyFont,
        setHeaderFont,
        headerFont,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
