import { useState, useEffect } from "react";
import { getCSSVariableValue } from "../../utilities/utilities";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "./ChartCard.css";

export const ChartCard = ({ type, data, loading, title }) => {
  const [primaryColor, setPrimaryColor] = useState("#000");
  const [secondaryColor, setSecondaryColor] = useState("#000");
  const [accentColor, setAccentColor] = useState("#000");

  const handleColorChange = () => {
    setPrimaryColor(getCSSVariableValue("--color-primary"));
    setSecondaryColor(getCSSVariableValue("--color-secondary"));
    setAccentColor(getCSSVariableValue("--color-accent"));
  };

  useEffect(() => {
    // Fetch the colors from :root CSS variables
    setPrimaryColor(getCSSVariableValue("--color-primary"));
    setSecondaryColor(getCSSVariableValue("--color-secondary"));
    setAccentColor(getCSSVariableValue("--color-accent"));
    // Listen for changes to the CSS variables
    window.addEventListener("colorChange", handleColorChange); // Custom event for color changes

    return () => window.removeEventListener("colorChange", handleColorChange); 
  }, []); // Run only once when the component mounts// Fetch color from CSS

  const renderChart = () => {
    if (loading) {
      return <div className="loading-spinner">Loading...</div>; // Show loading spinner
    }

    switch (type) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="uv" stroke={accentColor} />
            </LineChart>
          </ResponsiveContainer>
        );
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill={accentColor} />
            </BarChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill={accentColor}
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="uv"
                stroke={primaryColor}
                fill={accentColor}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="chart-card">
      <div className="title-container">{title}</div>
      <div className="chart-container">{renderChart()}</div>
    </div>
  );
};
