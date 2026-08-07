import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { LuSlidersHorizontal } from "react-icons/lu";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TopBar } from "./components/TopBar/TopBar";
import { PreviewPane } from "./components/Preview/PreviewPane";
import { ThemeSettings } from "./components/ThemeSettings/ThemeSettings";
import { IntroOverlay } from "./components/Intro/IntroOverlay";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="app-shell">
          <TopBar />
          <div className="workspace">
            <PreviewPane>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/signin" element={<AboutPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
              </Routes>
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
