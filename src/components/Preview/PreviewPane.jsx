import "./PreviewPane.css";
import { NavLink, useLocation } from "react-router-dom";

const TABS = [
  { to: "/", label: "Landing", slug: "landing" },
  { to: "/signin", label: "Sign in", slug: "sign-in" },
  { to: "/dashboard", label: "Dashboard", slug: "dashboard" },
];

export const PreviewPane = ({ children }) => {
  const { pathname } = useLocation();
  const current = TABS.find((t) => t.to === pathname) ?? TABS[0];

  return (
    <div className="preview-pane">
      <div className="preview-toolbar">
        <div className="preview-dots" aria-hidden="true">
          <span /> <span /> <span />
        </div>

        <nav className="preview-tabs" aria-label="Preview page">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
              className={({ isActive }) =>
                isActive ? "preview-tab active" : "preview-tab"
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className="preview-url">
          <span className="preview-url-badge">Live preview</span>
          <span className="preview-url-text">yoursite.com/{current.slug}</span>
        </div>
      </div>

      <div className="preview-viewport">
        <div className="preview-surface">{children}</div>
      </div>
    </div>
  );
};
