// Curated starting points. Each theme ships a hand-tuned light and dark variant
// (5 roles: primary / secondary / accent / background / text) plus a font pairing.
// The first entry is the app's default.
export const predefinedThemes = [
  {
    name: "Indigo",
    light: { primary: "#4f46e5", secondary: "#64748b", accent: "#f59e0b", background: "#ffffff", text: "#0f172a" },
    dark: { primary: "#818cf8", secondary: "#94a3b8", accent: "#fbbf24", background: "#0f172a", text: "#e2e8f0" },
    headerFont: "Poppins",
    bodyFont: "Inter",
  },
  {
    name: "Emerald",
    light: { primary: "#059669", secondary: "#0d9488", accent: "#f59e0b", background: "#f8fafc", text: "#064e3b" },
    dark: { primary: "#34d399", secondary: "#2dd4bf", accent: "#fbbf24", background: "#022c22", text: "#d1fae5" },
    headerFont: "Montserrat",
    bodyFont: "Open Sans",
  },
  {
    name: "Rose",
    light: { primary: "#e11d48", secondary: "#9f1239", accent: "#fb7185", background: "#fff1f2", text: "#4c0519" },
    dark: { primary: "#fb7185", secondary: "#f43f5e", accent: "#fda4af", background: "#1f1013", text: "#ffe4e6" },
    headerFont: "Playfair Display",
    bodyFont: "Lato",
  },
  {
    name: "Ocean",
    light: { primary: "#0284c7", secondary: "#0891b2", accent: "#38bdf8", background: "#f0f9ff", text: "#0c4a6e" },
    dark: { primary: "#38bdf8", secondary: "#22d3ee", accent: "#7dd3fc", background: "#082f49", text: "#e0f2fe" },
    headerFont: "Raleway",
    bodyFont: "Nunito",
  },
  {
    name: "Sunset",
    light: { primary: "#ea580c", secondary: "#db2777", accent: "#f59e0b", background: "#fff7ed", text: "#431407" },
    dark: { primary: "#fb923c", secondary: "#f472b6", accent: "#fbbf24", background: "#1c1207", text: "#ffedd5" },
    headerFont: "Oswald",
    bodyFont: "Work Sans",
  },
  {
    name: "Violet",
    light: { primary: "#7c3aed", secondary: "#a855f7", accent: "#ec4899", background: "#faf5ff", text: "#3b0764" },
    dark: { primary: "#a78bfa", secondary: "#c084fc", accent: "#f472b6", background: "#1e1030", text: "#f3e8ff" },
    headerFont: "Quicksand",
    bodyFont: "Rubik",
  },
  {
    name: "Slate",
    light: { primary: "#0f172a", secondary: "#475569", accent: "#3b82f6", background: "#ffffff", text: "#0f172a" },
    dark: { primary: "#e2e8f0", secondary: "#94a3b8", accent: "#60a5fa", background: "#0b1120", text: "#e2e8f0" },
    headerFont: "Inter",
    bodyFont: "Inter",
  },
  {
    name: "Forest",
    light: { primary: "#166534", secondary: "#4d7c0f", accent: "#ca8a04", background: "#f7fee7", text: "#14290a" },
    dark: { primary: "#4ade80", secondary: "#a3e635", accent: "#facc15", background: "#0a1f0a", text: "#ecfccb" },
    headerFont: "Merriweather",
    bodyFont: "Open Sans",
  },
  {
    name: "Mango",
    light: { primary: "#d97706", secondary: "#ca8a04", accent: "#16a34a", background: "#fffbeb", text: "#451a03" },
    dark: { primary: "#fbbf24", secondary: "#fde047", accent: "#4ade80", background: "#1c1508", text: "#fef3c7" },
    headerFont: "Poppins",
    bodyFont: "Nunito",
  },
  {
    name: "Grape",
    light: { primary: "#9333ea", secondary: "#c026d3", accent: "#06b6d4", background: "#fdf4ff", text: "#3b0764" },
    dark: { primary: "#c084fc", secondary: "#e879f9", accent: "#22d3ee", background: "#1a0b26", text: "#f5d0fe" },
    headerFont: "Montserrat",
    bodyFont: "Lato",
  },
  {
    name: "High Contrast",
    light: { primary: "#000000", secondary: "#1f2937", accent: "#eab308", background: "#ffffff", text: "#000000" },
    dark: { primary: "#ffffff", secondary: "#e5e7eb", accent: "#facc15", background: "#000000", text: "#ffffff" },
    headerFont: "Arial",
    bodyFont: "Arial",
  },
];

// Curated font menu. System fonts need no network; the rest are loaded in index.css.
export const predefinedFonts = [
  "Inter",
  "Poppins",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Nunito",
  "Raleway",
  "Work Sans",
  "Rubik",
  "Quicksand",
  "Josefin Sans",
  "Oswald",
  "Merriweather",
  "Playfair Display",
  "Lora",
  "Lobster",
  "Bebas Neue",
  "Anton",
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
];

export const faqQuestions = [
  {
    title: "What is Theme Lab?",
    content:
      "Theme Lab is a live theme editor. You pick five colors and two fonts, watch them apply instantly to real UI (a landing page, a sign-in screen and a dashboard), then export the result as ready-to-paste CSS. No sign-up, nothing to install.",
  },
  {
    title: "How do I use my theme in a real project?",
    content:
      "Open the Export panel in the sidebar and copy the CSS variables (or the Tailwind / JSON output). Paste them into your project's root stylesheet and reference them like var(--color-primary). Both light and dark scales are exported for you.",
  },
  {
    title: "What do the AA / AAA badges mean?",
    content:
      "They show the WCAG 2.1 contrast ratio between your text and background. AA is the baseline for accessible body text (4.5:1), AAA is the enhanced target (7:1). If you see 'Fail', your text will be hard to read — nudge the colors until it passes.",
  },
  {
    title: "Can I share a theme I made?",
    content:
      "Yes. Hit 'Share' in the top bar and send the URL — it encodes the full theme, so whoever opens it sees exactly what you designed. Your work is also saved automatically in your browser, so a refresh won't lose it.",
  },
  {
    title: "What does locking a color do?",
    content:
      "Locking pins a color so it survives the Randomize button. Lock the two brand colors you're sure about, then keep randomizing to explore accent and background options around them.",
  },
  {
    title: "Is it accessible and free?",
    content:
      "It's 100% free with no account required, and the built-in contrast checker helps you keep the themes you build accessible.",
  },
];
