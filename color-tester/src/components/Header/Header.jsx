import { NavLink } from "react-router-dom";
import "./Header.css";
import logo from "../../assets/color_logo.svg";

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <a className="logo-container" href="/">
          <img src={logo} className="logotype" />
          <h1 className="header-title">Theme Lab</h1>
        </a>
        <nav>
          <ul className="nav">
            <li className="nav-item">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? "nav-link active-link" : "nav-link"
                }
              >
                Landing Page
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  isActive ? "nav-link active-link" : "nav-link"
                }
              >
                Sign up / Sign in Page
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive ? "nav-link active-link" : "nav-link"
                }
              >
                Dashboard
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
