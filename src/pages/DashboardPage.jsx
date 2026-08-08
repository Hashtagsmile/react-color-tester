import "./DashboardPage.css";
import { useEffect, useState } from "react";
import {
  FiGrid,
  FiBarChart2,
  FiUsers,
  FiFileText,
  FiSettings,
  FiSearch,
} from "react-icons/fi";
import { Widget } from "../components/DbWidget/Widget.jsx";
import { ChartCard } from "../components/Chart/ChartCard.jsx";
import {
  revenueData,
  deviceData,
  sparkRevenue,
  sparkUsers,
  sparkOrders,
  sparkConversion,
  activityRows,
} from "../data/chartData.js";

const NAV_ITEMS = [
  { label: "Nav item · active", icon: FiGrid, active: true },
  { label: "Nav item", icon: FiBarChart2 },
  { label: "Nav item", icon: FiUsers },
  { label: "Nav item", icon: FiFileText },
  { label: "Nav item", icon: FiSettings },
];

const STATUS_CLASS = {
  Paid: "is-paid",
  Pending: "is-pending",
  Refunded: "is-refunded",
};

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState([]);
  const [devices, setDevices] = useState([]);

  // Mimic API calls — keep the simulated loading state.
  useEffect(() => {
    const timer = setTimeout(() => {
      setRevenue(revenueData);
      setDevices(deviceData);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="preview-page page-dashboard">
      {/* Left nav rail — hides below ~760px */}
      <aside className="dash-rail">
        <div className="dash-brand">
          <span className="dash-brand-mark">◈</span>
          <span className="dash-brand-name">Your logo</span>
        </div>
        <nav className="dash-nav">
          {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
            <a
              key={label}
              className={`dash-nav-item${active ? " is-active" : ""}`}
              href="#"
              onClick={(e) => e.preventDefault()}
            >
              <Icon className="dash-nav-icon" />
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="dash-rail-card">
          <p className="dash-rail-card-title">Rail card title</p>
          <p className="dash-rail-card-body">18 days left on your plan.</p>
          <button className="dash-rail-card-btn" type="button">
            Upgrade
          </button>
        </div>
      </aside>

      {/* Content area */}
      <main className="dash-main">
        <header className="dash-topbar">
          <div className="dash-topbar-lead">
            <h2 className="dash-title">Page title</h2>
            <p className="dash-subtitle">Page subtitle · muted</p>
          </div>
          <div className="dash-topbar-actions">
            <div className="dash-search">
              <FiSearch className="dash-search-icon" />
              <input
                className="dash-search-input"
                type="text"
                placeholder="Search…"
                aria-label="Search"
              />
            </div>
            <span className="dash-avatar" aria-hidden="true">
              AS
            </span>
          </div>
        </header>

        <section className="dash-kpis" aria-label="Key metrics">
          <Widget
            label="Metric label"
            value="€ 82 300"
            rising
            percentage="12.4"
            spark={sparkRevenue}
          />
          <Widget
            label="Metric label"
            value="14 208"
            rising
            percentage="8.1"
            spark={sparkUsers}
            accent
          />
          <Widget
            label="Metric label"
            value="1 942"
            rising={false}
            percentage="3.2"
            spark={sparkOrders}
          />
          <Widget
            label="Metric label"
            value="4.7%"
            rising
            percentage="1.5"
            spark={sparkConversion}
            accent
          />
        </section>

        <section className="dash-charts" aria-label="Charts">
          <ChartCard
            type="area"
            data={revenue}
            loading={loading}
            title="Chart title"
            subtitle="Chart subtitle · muted"
            span
          />
          <ChartCard
            type="pie"
            data={devices}
            loading={loading}
            title="Chart title"
            subtitle="Chart subtitle · muted"
          />
        </section>

        <section className="dash-table-card" aria-label="Recent activity">
          <div className="dash-table-head">
            <div>
              <div className="dash-table-title">Table title</div>
              <div className="dash-table-subtitle">Table subtitle · muted</div>
            </div>
            <button className="dash-table-btn" type="button">
              Text button
            </button>
          </div>
          <div className="dash-table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Column header</th>
                  <th>Status</th>
                  <th className="dash-num">Number</th>
                  <th className="dash-num">Date</th>
                </tr>
              </thead>
              <tbody>
                {activityRows.map((row) => (
                  <tr key={row.email}>
                    <td>
                      <div className="dash-cust">
                        <span className="dash-cust-avatar" aria-hidden="true">
                          {row.name.charAt(0)}
                        </span>
                        <div className="dash-cust-meta">
                          <span className="dash-cust-name">{row.name}</span>
                          <span className="dash-cust-email">{row.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`dash-pill ${STATUS_CLASS[row.status]}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="dash-num dash-amount">{row.amount}</td>
                    <td className="dash-num dash-date">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
