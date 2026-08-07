import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "./ChartCard.css";

// Local helper — read a themed CSS custom property off :root.
// Kept inside this file so the chart colors stay in sync with the
// live theme without reaching into shared utilities.
const readThemeVar = (variable, fallback = "#000000") => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return value || fallback;
};

// Build a color-mix expression against the live text/background so grid
// lines, axes and tooltips read as "muted" under ANY palette.
const mix = (token, pct, against = "--color-background") =>
  `color-mix(in srgb, var(${token}) ${pct}%, var(${against}))`;

export const ChartCard = ({ type, data, loading, title, subtitle, span }) => {
  const [colors, setColors] = useState({
    primary: "#000",
    secondary: "#000",
    accent: "#000",
  });

  useEffect(() => {
    const syncColors = () => {
      setColors({
        primary: readThemeVar("--color-primary"),
        secondary: readThemeVar("--color-secondary"),
        accent: readThemeVar("--color-accent"),
      });
    };

    // Read once on mount, then stay in sync with live theme changes.
    syncColors();
    window.addEventListener("colorChange", syncColors);
    return () => window.removeEventListener("colorChange", syncColors);
  }, []);

  const { primary, secondary, accent } = colors;

  const axisTick = {
    fill: mix("--color-text", 55),
    fontSize: 12,
    fontFamily: "var(--body-font-family)",
  };
  const gridStroke = mix("--color-text", 12);

  const tooltipStyle = {
    background: mix("--color-text", 6),
    border: `1px solid ${mix("--color-text", 14)}`,
    borderRadius: 10,
    fontFamily: "var(--body-font-family)",
    fontSize: "0.8rem",
    color: "var(--color-text)",
    boxShadow: "0 8px 24px color-mix(in srgb, var(--color-text) 14%, transparent)",
  };

  const renderChart = () => {
    if (loading) {
      return <div className="loading-spinner">Loading…</div>;
    }

    if (type === "area") {
      return (
        <ResponsiveContainer width="100%" height={264}>
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primary} stopOpacity={0.32} />
                <stop offset="100%" stopColor={primary} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={gridStroke} />
            <XAxis dataKey="name" tick={axisTick} tickLine={false} axisLine={false} dy={6} />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ stroke: gridStroke, strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="target"
              stroke={mix("--color-text", 28)}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="none"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={primary}
              strokeWidth={2.5}
              fill="url(#rev-fill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (type === "pie") {
      const pieColors = [primary, accent, secondary, mix("--color-text", 30)];
      const total = data.reduce((sum, d) => sum + d.value, 0);
      return (
        <div className="pie-wrap">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="pie-legend">
            {data.map((entry, index) => (
              <li key={entry.name} className="pie-legend-item">
                <span
                  className="pie-dot"
                  style={{ background: pieColors[index % pieColors.length] }}
                />
                <span className="pie-name">{entry.name}</span>
                <span className="pie-pct">
                  {Math.round((entry.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`chart-card${span ? " chart-card--wide" : ""}`}>
      <div className="chart-head">
        <div>
          <div className="chart-title">{title}</div>
          {subtitle && <div className="chart-subtitle">{subtitle}</div>}
        </div>
      </div>
      <div className="chart-container">{renderChart()}</div>
    </div>
  );
};

ChartCard.propTypes = {
  type: PropTypes.oneOf(["area", "pie"]).isRequired,
  data: PropTypes.array,
  loading: PropTypes.bool,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  span: PropTypes.bool,
};
