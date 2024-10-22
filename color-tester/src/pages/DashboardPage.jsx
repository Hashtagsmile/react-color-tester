import "./DashboardPage.css";
import React, { useEffect, useState } from "react";
import { Widget } from "../components/Widget/Widget"
import { ChartCard } from "../components/Chart/ChartCard";
import {
  lineChartData,
  pieChartData,
  areaChartData,
  barChartData,
} from "../data/chartData";
const ContactPage = () => {
  const [loading, setLoading] = useState(true);
  const [lineData, setLineData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [areaData, setAreaData] = useState([]);

  // Mimic API calls using useEffect
  useEffect(() => {
    // Simulate API calls
    setTimeout(() => {
      setLineData(lineChartData);
      setBarData(barChartData);
      setPieData(pieChartData);
      setAreaData(areaChartData);
      setLoading(false);
    }, 500); // Mimic 0.5 second delay for API
  }, []);

  return (
    <div className="dashboard">
      <section className="widgets-container">
        <div className="widgets-title">Last 30 days</div>
        <div className="dashboard-widgets">
          <Widget
            title="Revenue"
            rising="True"
            percentage="30"
            amount="40 000"
          />
          <Widget title="Expenses" percentage="13" amount="23 000" />
          <Widget
            title="Income"
            rising="True"
            percentage="50"
            amount="80 372"
          />
        </div>
      </section>
      <section className="dashboard-content">
        <ChartCard type="line" data={lineData} loading={loading} title="Sales Line Chart" />
        <ChartCard type="bar" data={barData} loading={loading} title="Product Sales Bar Chart" />
        <ChartCard type="pie" data={pieData} loading={loading} title="User Demographics Pie Chart" />
        <ChartCard type="area" data={areaData} loading={loading} title="Website Traffic Area Chart" />
      </section>
    </div>
  );
};

export default ContactPage;
