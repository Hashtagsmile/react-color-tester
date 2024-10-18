export const rgbaToHex = (rgba) => {
  // Extract rgba or rgb values using regex
  const parts = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!parts) return rgba; // Fallback if rgba not found or wrong format

  // Convert the individual r, g, b values to hexadecimal format
  const r = parseInt(parts[1]).toString(16).padStart(2, "0");
  const g = parseInt(parts[2]).toString(16).padStart(2, "0");
  const b = parseInt(parts[3]).toString(16).padStart(2, "0");

  // Return the RGB hex color
  return `#${r}${g}${b}`;
}

// Utility to check if color is light or dark
export const isColorLight = (color) => {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate the luminance using the formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return true if the color is light
  return luminance > 0.5;
};
