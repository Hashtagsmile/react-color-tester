import "./App.css";
import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { LuSlidersHorizontal } from "react-icons/lu";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TopBar } from "./components/TopBar/TopBar";
import { PreviewPane } from "./components/Preview/PreviewPane";
import { ThemeSettings } from "./components/ThemeSettings/ThemeSettings";
import { IntroOverlay } from "./components/Intro/IntroOverlay";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";

// The dashboard is the only surface that pulls in Recharts, which is the bulk of
// the bundle. Splitting it here keeps the landing route — the one a first-time
// visitor actually lands on — from paying for charts it never renders.
const DashboardPage = lazy(() => import("./pages/DashboardPage"));

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="app-shell">
          <TopBar />
          <div className="workspace">
            <PreviewPane>
              <Suspense fallback={<div className="route-loading" aria-busy="true" />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/signin" element={<AboutPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                </Routes>
              </Suspense>
            </PreviewPane>
            <ThemeSettings />
          </div>
          {/* On narrow screens the editor stacks below the preview, far out of
              sight. This jump link is the only hint that it's down there. */}
          <a className="editor-jump" href="#theme-editor">
            <LuSlidersHorizontal aria-hidden="true" />
            Edit theme
          </a>
          <IntroOverlay />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
