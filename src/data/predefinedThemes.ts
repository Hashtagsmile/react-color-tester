import type { Palette } from "../lib/types";

/** A curated starting point: a light and dark palette plus a font pairing. */
export interface Preset {
  name: string;
  light: Palette;
  dark: Palette;
  headerFont: string;
  bodyFont: string;
}

export interface FaqEntry {
  title: string;
  content: string;
}

// Curated starting points. Each theme ships a hand-tuned light and dark variant
// (5 roles: primary / secondary / accent / background / text) plus a font pairing.
// The first entry is the app's default.
export const predefinedThemes: Preset[] = [
  {
    name: "Indigo",
    light: { primary: "#4f46e5", secondary: "#64748b", accent: "#bf7100", background: "#ffffff", text: "#0f172a" },
    dark: { primary: "#818cf8", secondary: "#94a3b8", accent: "#fbbf24", background: "#0f172a", text: "#e2e8f0" },
    headerFont: "Poppins",
    bodyFont: "Inter",
  },
  {
    name: "Emerald",
    light: { primary: "#059669", secondary: "#0d9488", accent: "#bb6e00", background: "#f8fafc", text: "#064e3b" },
    dark: { primary: "#34d399", secondary: "#2dd4bf", accent: "#fbbf24", background: "#022c22", text: "#d1fae5" },
    headerFont: "Montserrat",
    bodyFont: "Open Sans",
  },
  {
    name: "Rose",
    light: { primary: "#e11d48", secondary: "#9f1239", accent: "#d85168", background: "#fff1f2", text: "#4c0519" },
    dark: { primary: "#fb7185", secondary: "#f43f5e", accent: "#fda4af", background: "#1f1013", text: "#ffe4e6" },
    headerFont: "Playfair Display",
    bodyFont: "Lato",
  },
  {
    name: "Ocean",
    light: { primary: "#0284c7", secondary: "#0891b2", accent: "#0087bf", background: "#f0f9ff", text: "#0c4a6e" },
    dark: { primary: "#38bdf8", secondary: "#22d3ee", accent: "#7dd3fc", background: "#082f49", text: "#e0f2fe" },
    headerFont: "Raleway",
    bodyFont: "Nunito",
  },
  {
    name: "Sunset",
    light: { primary: "#ea580c", secondary: "#db2777", accent: "#bb6e00", background: "#fff7ed", text: "#431407" },
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
    light: { primary: "#166534", secondary: "#4d7c0f", accent: "#b47800", background: "#f7fee7", text: "#14290a" },
    dark: { primary: "#4ade80", secondary: "#a3e635", accent: "#facc15", background: "#0a1f0a", text: "#ecfccb" },
    headerFont: "Merriweather",
    bodyFont: "Open Sans",
  },
  {
    name: "Mango",
    light: { primary: "#d97706", secondary: "#b47800", accent: "#16a34a", background: "#fffbeb", text: "#451a03" },
    dark: { primary: "#fbbf24", secondary: "#fde047", accent: "#4ade80", background: "#1c1508", text: "#fef3c7" },
    headerFont: "Poppins",
    bodyFont: "Nunito",
  },
  {
    name: "Grape",
    light: { primary: "#9333ea", secondary: "#c026d3", accent: "#008ca8", background: "#fdf4ff", text: "#3b0764" },
    dark: { primary: "#c084fc", secondary: "#e879f9", accent: "#22d3ee", background: "#1a0b26", text: "#f5d0fe" },
    headerFont: "Montserrat",
    bodyFont: "Lato",
  },
  {
    name: "High Contrast",
    light: { primary: "#000000", secondary: "#1f2937", accent: "#ad7e00", background: "#ffffff", text: "#000000" },
    dark: { primary: "#ffffff", secondary: "#e5e7eb", accent: "#facc15", background: "#000000", text: "#ffffff" },
    headerFont: "Arial",
    bodyFont: "Arial",
  },
];

// Curated font menu. System fonts need no network; the rest are loaded in index.css.
export const predefinedFonts: string[] = [
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

/**
 * FAQ copy for Northwind, the fictional product rendered inside the preview.
 *
 * This has to stay in Northwind's voice. Theme Lab's own help text belongs in the
 * "How it works" guide — putting it here meant the fake product's marketing page
 * was answering questions about the real tool, which read as a bug.
 */
export const faqQuestions: FaqEntry[] = [
  {
    title: "How long does it take to get set up?",
    content:
      "Most teams are running the same afternoon. Import your existing projects from a CSV or one of our integrations, invite the people who need access, and Northwind builds your first workspace automatically. No migration project, no professional services engagement.",
  },
  {
    title: "Can we try it before committing?",
    content:
      "Every plan starts with a 14-day trial of the full product — no credit card, no feature gates. If you need longer to run a proper pilot, tell us and we'll extend it.",
  },
  {
    title: "How does pricing work as the team grows?",
    content:
      "You pay per active member per month, billed monthly or annually. Guests and read-only viewers are free, so bringing in clients or stakeholders never changes your bill.",
  },
  {
    title: "Does Northwind replace our other tools?",
    content:
      "For most teams it replaces the project tracker, the docs wiki and the status-update spreadsheet. It sits alongside your chat and code tools rather than competing with them — there are native integrations for both.",
  },
  {
    title: "How do you handle security and access control?",
    content:
      "Granular per-workspace permissions, full audit logs and SAML SSO on every business plan. Data is encrypted in transit and at rest, and you can export everything you've put in at any time.",
  },
  {
    title: "What happens to our data if we leave?",
    content:
      "You export it. Projects, docs, comments and attachments come out as structured JSON plus original files, and we keep nothing after the account closes.",
  },
];
