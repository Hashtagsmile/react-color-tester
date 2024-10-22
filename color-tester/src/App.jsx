import "./App.css";
import Layout from "./components/Layout";
import AboutPage from "./pages/AboutPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ThemeSettings } from "./components/ThemeSettings/ThemeSettings";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
          <ThemeSettings/>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
