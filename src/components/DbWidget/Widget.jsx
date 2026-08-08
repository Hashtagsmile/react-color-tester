import "./Widget.css";
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

// Read a themed CSS custom property off :root so the sparkline stroke
// tracks the live theme (mirrors the ChartCard helper).
const readThemeVar = (variable, fallback = "#000000") => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return value || fallback;
};

export const Widget = ({ label, value, rising, percentage, spark, accent }) => {
  const [stroke, setStroke] = useState("#000");

  useEffect(() => {
    const sync = () =>
      setStroke(readThemeVar(accent ? "--color-accent" : "--color-primary"));
    sync();
    window.addEventListener("colorChange", sync);
    return () => window.removeEventListener("colorChange", sync);
  }, [accent]);

  const gradId = `spark-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="widget-card">
      <div className="widget-top">
        <span className="widget-label">{label}</span>
        <span className={`widget-delta ${rising ? "is-up" : "is-down"}`}>
          {rising ? <FiArrowUpRight /> : <FiArrowDownRight />}
          {percentage}%
        </span>
      </div>

      <div className="widget-value">{value}</div>

      <div className="widget-foot">
        <span className="widget-caption">vs. previous 30 days</span>
        <div className="widget-spark" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={spark}
              margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={stroke}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                isAnimationActive={false}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

Widget.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  rising: PropTypes.bool,
  percentage: PropTypes.string,
  spark: PropTypes.arrayOf(PropTypes.object),
  accent: PropTypes.bool,
};
