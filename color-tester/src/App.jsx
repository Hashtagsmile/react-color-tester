import "./App.css";
import Layout from "./components/Layout";
import ThemeNavBar from "./components/ThemeNavbar";
import AboutPage from "./pages/AboutPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";


function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
        <ThemeNavBar className=""/>
      </Layout>
    </Router>
  );
}

export default App;
